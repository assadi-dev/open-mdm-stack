import type { Page } from "@playwright/test";

// Le navigateur de test n'a aucun appareil Android et ne peut pas cliquer dans la fenêtre de sélection de WebUSB : on la
// remplace par un faux appareil, qui répond à la connexion ADB comme un démon déjà autorisé (aucune boîte de dialogue).
// - `device` : la fenêtre choisit le Pixel 8 ci-dessous ;
// - `cancel` : la fenêtre est refermée sans choix ;
// - `busy` : un autre programme tient l'appareil (le serveur ADB local, par exemple) ;
// - `unsupported` : WebUSB est retiré (Firefox, Safari, page non sécurisée).
type WebUsbStub = "device" | "cancel" | "busy" | "unsupported";

export const USB_DEVICE = { manufacturer: "Google", product: "Pixel 8", serial: "3A1B7K2P" };

// À appeler avant la navigation : le script s'exécute au chargement de la page suivante, avant ceux de l'application.
export const stubWebUsb = (page: Page, stub: WebUsbStub) =>
  page.addInitScript(
    ({ mode, usbDevice }) => {
      // Les commandes du protocole ADB : leur nom, lu en octets (« CNXN », « OPEN »…).
      const CNXN = 0x4e584e43;
      const OPEN = 0x4e45504f;
      const OKAY = 0x59414b4f;
      const CLSE = 0x45534c43;
      const WRTE = 0x45545257;
      const HEADER_SIZE = 24;
      const DEVICE_SOCKET_ID = 1;
      const INSTALL_DURATION = 200;
      const log: string[] = [];

      const toResult = (bytes: Uint8Array) => ({ status: "ok", data: new DataView(bytes.slice().buffer) });

      // Ce que le démon envoie : l'en-tête de 24 octets, puis la charge, chacun lu par son propre `transferIn`.
      const incoming: Uint8Array[] = [];
      let waiting: { resolve: (result: ReturnType<typeof toResult>) => void; reject: (error: Error) => void } | null = null;
      const flush = () => {
        if (!waiting || incoming.length === 0) return;
        const { resolve } = waiting;
        waiting = null;
        resolve(toResult(incoming.shift()!));
      };
      const send = (command: number, arg0: number, arg1: number, text: string) => {
        const payload = new TextEncoder().encode(text);
        const header = new Uint8Array(HEADER_SIZE);
        const view = new DataView(header.buffer);
        view.setUint32(0, command, true);
        view.setUint32(4, arg0, true);
        view.setUint32(8, arg1, true);
        view.setUint32(12, payload.length, true);
        view.setUint32(16, payload.reduce((sum, byte) => sum + byte, 0), true);
        view.setUint32(20, (command ^ 0xffffffff) >>> 0, true);
        // Sans charge, l'en-tête seul : le navigateur ne lit pas de second morceau.
        incoming.push(...(payload.length ? [header, payload] : [header]));
        flush();
      };

      // L'installation de l'APK : le navigateur ouvre le service `abb_exec` (`-S` donne la taille de l'APK), lui envoie
      // l'APK, et l'appareil répond « Success » une fois toute la taille reçue. Un APK se retrouve dans le journal.
      const installs = new Map<number, { size: number; received: number }>();
      const handle = (command: number, arg0: number, payload: Uint8Array) => {
        // Le démon répond à la demande de connexion et ne réclame aucune autorisation.
        if (command === CNXN) {
          send(CNXN, 0x01000001, 0x100000, `device::ro.product.model=${usbDevice.product};features=shell_v2,cmd,stat_v2,abb_exec`);
        }
        if (command === OPEN) {
          const size = /\0-S\0(\d+)\0/.exec(new TextDecoder().decode(payload))?.[1];
          if (size === undefined) return send(CLSE, 0, arg0, "");
          installs.set(arg0, { size: Number(size), received: 0 });
          send(OKAY, DEVICE_SOCKET_ID, arg0, "");
        }
        if (command === WRTE) {
          const install = installs.get(arg0);
          send(OKAY, DEVICE_SOCKET_ID, arg0, "");
          if (!install) return;
          install.received += payload.length;
          if (install.received < install.size) return;
          log.push(`install:${install.received}`);
          installs.delete(arg0);
          // Une installation prend du temps : la réponse arrive après que le navigateur a fini d'envoyer, comme sur un
          // vrai appareil (répondre aussitôt ferme la socket pendant l'envoi).
          setTimeout(() => {
            send(WRTE, DEVICE_SOCKET_ID, arg0, "Success\n");
            send(CLSE, DEVICE_SOCKET_ID, arg0, "");
          }, INSTALL_DURATION);
        }
      };

      // Ce que le navigateur envoie : un paquet peut arriver en plusieurs morceaux.
      let pending = new Uint8Array(0);
      const receive = (chunk: Uint8Array) => {
        pending = Uint8Array.from([...pending, ...chunk]);
        while (pending.length >= HEADER_SIZE) {
          const view = new DataView(pending.buffer, 0, HEADER_SIZE);
          const size = HEADER_SIZE + view.getUint32(12, true);
          if (pending.length < size) return;
          handle(view.getUint32(0, true), view.getUint32(4, true), pending.slice(HEADER_SIZE, size));
          pending = pending.slice(size);
        }
      };

      const inEndpoint = { direction: "in", endpointNumber: 1, packetSize: 512, type: "bulk" };
      const outEndpoint = { direction: "out", endpointNumber: 1, packetSize: 512, type: "bulk" };
      // Le filtre ADB de Google : classe 255, sous-classe 66, protocole 1. Sans cette interface, la librairie écarte l'appareil.
      const alternate = {
        alternateSetting: 0,
        interfaceClass: 255,
        interfaceSubclass: 66,
        interfaceProtocol: 1,
        endpoints: [inEndpoint, outEndpoint],
      };
      const adbInterface = { interfaceNumber: 0, claimed: false, alternate, alternates: [alternate] };
      const configuration = { configurationValue: 1, interfaces: [adbInterface] };

      const device = {
        vendorId: 0x18d1,
        productId: 0x4ee7,
        manufacturerName: usbDevice.manufacturer,
        productName: usbDevice.product,
        serialNumber: usbDevice.serial,
        opened: false,
        configuration: null as typeof configuration | null,
        configurations: [configuration],
        open: async () => {
          device.opened = true;
          log.push("open");
        },
        selectConfiguration: async () => {
          device.configuration = configuration;
        },
        claimInterface: async () => {
          if (mode === "busy") throw new DOMException("Unable to claim interface.", "NetworkError");
          adbInterface.claimed = true;
          log.push("claim");
        },
        selectAlternateInterface: async () => undefined,
        transferIn: () =>
          new Promise<ReturnType<typeof toResult>>((resolve, reject) => {
            waiting = { resolve, reject };
            flush();
          }),
        transferOut: async (_endpoint: number, data: Uint8Array) => {
          receive(data);
          return { status: "ok", bytesWritten: data.byteLength };
        },
        close: async () => {
          device.opened = false;
          log.push("close");
          // La lecture en cours échoue comme si le câble avait lâché : la librairie y voit une fermeture.
          waiting?.reject(new DOMException("Device closed.", "NetworkError"));
          waiting = null;
        },
        forget: async () => {
          log.push("forget");
        },
      };

      const usb = Object.assign(new EventTarget(), {
        requestDevice: async () => {
          if (mode === "cancel") throw new DOMException("No device selected.", "NotFoundError");
          return device;
        },
        getDevices: async () => [],
      });

      Object.defineProperty(navigator, "usb", { configurable: true, value: mode === "unsupported" ? undefined : usb });
      // La librairie annonce l'appareil par un `USBConnectionEvent`, que le navigateur refuse pour un faux appareil.
      Object.defineProperty(window, "USBConnectionEvent", {
        configurable: true,
        value: class extends Event {
          device: unknown;

          constructor(type: string, init?: { device?: unknown }) {
            super(type);
            this.device = init?.device;
          }
        },
      });
      Reflect.set(window, "__usbDevice", device);
      Reflect.set(window, "__usbLog", log);
    },
    { mode: stub, usbDevice: USB_DEVICE },
  );

// Ce que le faux appareil a reçu du navigateur, dans l'ordre : `open`, `claim`, `install:<octets de l'APK>`, `close`, `forget`.
export const readUsbLog = (page: Page) => page.evaluate(() => Reflect.get(window, "__usbLog") as string[]);

// Le câble est débranché : le navigateur le signale à la page, sans que l'utilisateur ait cliqué sur « Déconnecter ».
export const unplugUsbDevice = (page: Page) =>
  page.evaluate(() => {
    const event = new (Reflect.get(window, "USBConnectionEvent"))("disconnect", { device: Reflect.get(window, "__usbDevice") });
    navigator.usb.dispatchEvent(event);
  });
