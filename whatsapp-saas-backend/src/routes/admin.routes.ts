// src/routes/admin.routes.ts
import { Router } from "express";
import {
  activateMerchant,
  addCredits,
  extendSubscription,
  getAdminStats,
  getAllMerchants,
  launchCampaign,
} from "../controllers/admin.controller";
import { adminProtect } from "../middleware/admin.middleware";

const router = Router();
router.use(adminProtect);

router.get("/merchants", getAllMerchants);
router.post("/activate", activateMerchant);
router.post("/add-credits", addCredits);
router.get("/stats", getAdminStats);
router.post('/extend-subscription', extendSubscription);
router.post('/launch-campaign', launchCampaign);


export default router;
