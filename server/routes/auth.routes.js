import { Router } from "express";
import { asyncHandler } from "../utils/errors.js";
import { me, signin, signout, signup } from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", asyncHandler(signup));
router.post("/signin", asyncHandler(signin));
router.post("/signout", asyncHandler(signout));
router.get("/me", asyncHandler(me));

export default router;
