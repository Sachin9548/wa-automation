// src/routes/admin.routes.ts
import { Router } from "express";
import {
  activateMerchant, addCredits, extendSubscription,
  getAdminStats, getAllMerchants, launchCampaign,
  getMerchantDetail, getMerchantCampaigns, syncMerchantCustomers,
  getMerchantFlows, saveMerchantFlow, toggleMerchantFlow, getMerchantCustomers,
} from "../controllers/admin.controller";
import { adminProtect } from "../middleware/admin.middleware";

const router = Router();
router.use(adminProtect);

router.get("/merchants", getAllMerchants);
router.get("/merchants/:merchantId", getMerchantDetail);
router.post("/activate", activateMerchant);
router.post("/add-credits", addCredits);
router.get("/stats", getAdminStats);
router.post('/extend-subscription', extendSubscription);
router.post('/launch-campaign', launchCampaign);
router.get('/campaigns/:merchantId', getMerchantCampaigns);
router.post('/sync-customers', syncMerchantCustomers);
// Flow management from admin
router.get('/flows/:merchantId', getMerchantFlows);
router.post('/flows/save', saveMerchantFlow);
router.post('/flows/toggle', toggleMerchantFlow);
// Customers list
router.get('/customers/:merchantId', getMerchantCustomers);

export default router;
