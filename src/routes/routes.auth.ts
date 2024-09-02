import { Router } from "express";
import { login,  register,updateProfile,getProfile, verifyAccount, resendVerificationCode } from "../controllers/controllers.auth";
import { protectRoute } from "../utils/middleware.utils";

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.post("/verify-account", verifyAccount)
router.post("/re-send", protectRoute, resendVerificationCode)

router.get("/get-profile",protectRoute, getProfile )
router.put("/update-profile",protectRoute, updateProfile)

export default router