import { Router } from "express";
import {
  getStudentDashboard,
  getTeacherDashboard,
  exportClassReportCSV,
} from "./analytics.controller.js";
import { verifyUser } from "#modules/auth";
import { checkClassTeacherOwnership } from "#modules/class/index.js";

const router = Router();

router.use(verifyUser);

const requireTeacherOwnership = async (req, res, next) => {
  const { classId } = req.params;
  const { id: userId, role: userRole } = req.user;
  
  const isOwner = await checkClassTeacherOwnership(classId, userId, userRole);
  if (!isOwner) {
    return res.status(403).json({ success: false, message: "Forbidden: Not the owner of this class" });
  }
  next();
};

router.get("/student/dashboard/:classId", getStudentDashboard);
router.get("/teacher/dashboard/:classId", requireTeacherOwnership, getTeacherDashboard);
router.get("/teacher/export/:classId", requireTeacherOwnership, exportClassReportCSV);

export default router;
