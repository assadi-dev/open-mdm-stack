import { Request, Response } from "express";
import { WifiNetworkService } from "./service";
import {
    validateCreateWifiNetworkInput,
    validateDeleteWifiNetworksInput,
    validateUpdateWifiNetworkInput,
    validateWifiNetworkCollectionQuery,
    validateWifiNetworkIdParam,
} from "./validator";

export class WifiNetworkController {
    private wifiNetworkService: WifiNetworkService;

    constructor() {
        this.wifiNetworkService = new WifiNetworkService();
    }

    // POST /wifi-networks  (admin)
    create = async (req: Request, res: Response) => {
        const input = validateCreateWifiNetworkInput(req.body);
        const wifiNetwork = await this.wifiNetworkService.create(input);
        return res.status(201).json(wifiNetwork);
    };

    // GET /wifi-networks?page&limit&search&sort&security  (admin)
    collections = async (req: Request, res: Response) => {
        const query = validateWifiNetworkCollectionQuery(req.query);
        const result = await this.wifiNetworkService.collection(query);
        return res.json(result);
    };

    // GET /wifi-networks/lists  (admin)
    list = async (req: Request, res: Response) => {
        const wifiNetworks = await this.wifiNetworkService.list();
        return res.json(wifiNetworks);
    };

    // GET /wifi-networks/:id  (admin)
    getById = async (req: Request<{ id: string }>, res: Response) => {
        const id = validateWifiNetworkIdParam(req.params.id);
        const wifiNetwork = await this.wifiNetworkService.getById(id);
        return res.json(wifiNetwork);
    };

    // PATCH /wifi-networks/:id  (admin)
    update = async (req: Request<{ id: string }>, res: Response) => {
        const id = validateWifiNetworkIdParam(req.params.id);
        const input = validateUpdateWifiNetworkInput(req.body);
        const wifiNetwork = await this.wifiNetworkService.update(id, input);
        return res.json(wifiNetwork);
    };

    // DELETE /wifi-networks/:id  (admin)
    remove = async (req: Request<{ id: string }>, res: Response) => {
        const id = validateWifiNetworkIdParam(req.params.id);
        await this.wifiNetworkService.delete(id);
        return res.status(204).send();
    };

    // DELETE /wifi-networks  { ids: [...] }  (admin) — one id deletes a single network
    removeMany = async (req: Request, res: Response) => {
        const { ids } = validateDeleteWifiNetworksInput(req.body);
        await this.wifiNetworkService.deleteMany(ids);
        return res.status(204).send();
    };
}
