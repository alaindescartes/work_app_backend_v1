import { AppError } from "../utils/appError.js";
import { Request, Response, NextFunction } from "express";
import { addGroupHome, getGroupHomes } from "../models/grouphomeModel.js";
import { GroupHomeInsert } from "../models/interfaces/grouphome.interface.js";

export async function addGroupHomeData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const groupHomeData: GroupHomeInsert = req.body;
    if (
      !groupHomeData.name ||
      !groupHomeData.address ||
      !groupHomeData.status ||
      !groupHomeData.phone
    ) {
      return next(
        new AppError(
          "name, address, status, phone nbr fields must be provided",
          400
        )
      );
    }

    const newGroupHome = await addGroupHome(req.app.get("db"), groupHomeData);

    res.status(201).json({
      message: "Group Home added successfully",
      groupHome: newGroupHome,
    });
  } catch (error: any) {
    return next(new AppError(error.message || "could not add group home", 404));
  }
}

export async function getAllGrouphomes(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const grouphomes = await getGroupHomes(req.app.get("db"));

    if (grouphomes.length === 0) {
      return next(new AppError("there are no grouphomes found", 404));
    }
    res.status(200).json({ groupHomes: grouphomes });
  } catch (error: any) {
    return next(
      new AppError(
        error.message || "there was a problem while fetching residences",
        500
      )
    );
  }
}
