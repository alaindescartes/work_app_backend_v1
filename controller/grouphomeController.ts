import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import { addGroupHome, deleteHome, getGroupHomes } from '../models/grouphomeModel.js';
import { GroupHomeInsert } from '../models/interfaces/grouphome.interface.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export async function addGroupHomeData(req: Request, res: Response, next: NextFunction) {
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
      return next(new AppError('name, address, status, phone nbr fields must be provided', 400));
    }

    const groupHome: GroupHomeInsert = {
      ...groupHomeData,
    };

    //uploading data to cloudinary
    if (req.file?.buffer) {
      try {
        const result = await uploadToCloudinary(
          req.file!.buffer,
          `${groupHomeData.name}/groupHome_images`
        );
        groupHome.cloudinary_public_id = result.public_id;
        groupHome.image_url = result.secure_url;
        console.log(result);
      } catch (err) {
        console.log(err, 'cannot upload the file to cloudinary');
      }
    }

    const GroupHomeToAdd = await addGroupHome(req.app.get('db'), groupHome);
    res.status(201).json({
      message: 'Group Home added successfully',
      groupHome: groupHome,
    });
  } catch (error: any) {
    return next(new AppError(error.message || 'could not add group home', 404));
  }
}

export async function getAllGrouphomes(req: Request, res: Response, next: NextFunction) {
  try {
    const grouphomes = await getGroupHomes(req.app.get('db'));

    if (grouphomes.length === 0) {
      return next(new AppError('there are no grouphomes found', 404));
    }
    console.log(grouphomes);
    res.status(200).json({ groupHomes: grouphomes });
  } catch (error: any) {
    return next(
      new AppError(error.message || 'there was a problem while fetching residences', 500)
    );
  }
}

export async function deleteGroupHome(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('can not delete without a valid Id', 400));
  }

  try {
    const homeToDelete = await deleteHome(req.app.get('db'), id);
    if (!homeToDelete) {
      return next(new AppError('No group home found with that ID', 404));
    }
    res.status(200).json({ deleted: homeToDelete });
  } catch (error: any) {
    return next(new AppError(error.message || 'could not delete without a valid Id', 500));
  }
}
