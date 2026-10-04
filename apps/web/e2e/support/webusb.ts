import type { Page } from "@playwright/test";

// Le navigateur de test n'a aucun appareil Android et ne peut pas cliquer dans la fenêtre de sélection de WebUSB : on la
// remplace. `device` choisit le Pixel 8 ci-dessous, `cancel` referme la fenêtre sans choix, `unsupported` retire WebUSB
// (Firefox, Safari, page non sécurisée).
type WebUsbStub = "device" | "cancel" | "unsupported";

export const USB_DEVICE = { manufacturer: "Google", product: "Pixel 8", serial: "3A1B7K2P" };

// À appeler avant la navigation : le script s'exécute au chargement de la page suivante, avant ceux de l'application.
export const stubWebUsb = (page: Page, stub: WebUsbStub) =>
  page.addInitScript(
    ({ mode, usbDevice }) => {
      // Le filtre ADB de Google : classe 255, sous-classe 66, protocole 1. Sans cette interface, la librairie écarte l'appareil.
      const adbInterface = { alternates: [{ interfaceClass: 255, interfaceSubclass: 66, interfaceProtocol: 1 }] };
      const device = {
        vendorId: 0x18d1,
        productId: 0x4ee7,
        manufacturerName: usbDevice.manufacturer,
        productName: usbDevice.product,
        serialNumber: usbDevice.serial,
        configurations: [{ configurationValue: 1, interfaces: [adbInterface] }],
      };
      const requestDevice = async () => {
        if (mode === "cancel") throw new DOMException("No device selected.", "NotFoundError");
        return device;
      };

      Object.defineProperty(navigator, "usb", {
        configurable: true,
        value: mode === "unsupported" ? undefined : { requestDevice, dispatchEvent: () => true },
      });
      // La librairie annonce l'appareil par un `USBConnectionEvent`, que le navigateur refuse pour un faux appareil.
      Object.defineProperty(window, "USBConnectionEvent", { configurable: true, value: class extends Event {} });
    },
    { mode: stub, usbDevice: USB_DEVICE },
  );
