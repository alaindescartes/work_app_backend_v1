import { AppError } from "../utils/appError.js";
import { Request, Response, NextFunction } from "express";
import { addGroupHome, getGroupHomes } from "../models/grouphomeModel.js";
import { GroupHomeInsert } from "../models/interfaces/grouphome.interface.js";

export async function addGroupHomeData(
  req: Request,
  res: Response,
  next: NextFunction
) {
  //interface for a new groupHome
  interface newGroupHome {
    name: string;
    address: string;
    phone: string;
    status: string;
    managerName?: string;
    supervisorName?: string;
    type?: string;
    notes?: string;
  }

  try {
    const groupHomeData: newGroupHome = req.body;
    console.log(groupHomeData);
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
    console.log("File name:", req.file?.originalname);
    console.log("File buffer:", req.file?.buffer); // if uploading to Cloudinary
    console.log("Text fields:", req.body); // name, address, etc.
    //const newGroupHome = await addGroupHome(req.app.get("db"), groupHomeData);
    res.status(200).json({message:"good"})
    // res.status(201).json({
    //   message: "Group Home added successfully",
    //   groupHome: newGroupHome,
    // });
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
