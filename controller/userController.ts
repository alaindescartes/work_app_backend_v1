import { AppError } from "../utils/appError.js";
import { Request, Response, NextFunction } from "express";
import { addStaff, StaffInsert, deleteStaff } from "../models/staffModel.js";
import bcrypt from "bcrypt";

export async function addStaffData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const staffData: StaffInsert = req.body;
    if (
      !staffData.firstName ||
      !staffData.lastName ||
      !staffData.email ||
      !staffData.hireDate ||
      !staffData.password ||
      !staffData.phoneNumber ||
      !staffData.role ||
      !staffData.status
    ) {
      return next(new AppError("all fields must be provided", 400));
    }
    const { password } = staffData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const data = { ...staffData, password: hashedPassword };

    const newStaff = await addStaff(req.app.get("db"), data);

    //remove password from newly stored data
    const { password: _, ...otherData } = newStaff;

    res
      .status(201)
      .json({ message: "Staff added successfully", staff: otherData });
  } catch (error: any) {
    return next(new AppError(error.message || "could not add staff", 404));
  }
}

export async function deleteStaffData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { firstName, lastName } = req.body;

  if (!lastName || !firstName) {
    return next(new AppError("all fields must be provided for deletion", 400));
  }
  try {
    const deletedStaffData = await deleteStaff(req.app.get("db"), {
      firstName: firstName,
      lastName: lastName,
    });
    res.status(201).json({
      message: "staff deleted successfully",
      staff: deletedStaffData,
    });
  } catch (error: any) {
    next(new AppError(error.message || "Staff not found", 404));
  }
}
