import { AppError } from '../utils/appError.js';
import { Request, Response, NextFunction } from 'express';
import {
  addGroupHome,
  deleteHome,
  getGroupHomes,
  getSingleGroupHome,
  updateGroupHome,
} from '../models/grouphomeModel.js';
import { GroupHomeInsert } from '../models/interfaces/grouphome.interface.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

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
export async function addGroupHomeData(req: Request, res: Response, next: NextFunction) {
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

export async function editGroupHome(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  const edits: newGroupHome = req.body;
  console.log('received', req.body);
  if (!id) {
    return next(new AppError('can not edit without a valid Id', 400));
  }
  try {
    const homeToEdit = await getSingleGroupHome(req.app.get('db'), id);
    if (!homeToEdit) {
      return next(new AppError('No group home found with that ID', 404));
    }

    const groupHome: GroupHomeInsert = {
      ...homeToEdit,
      ...Object.keys(edits).reduce((acc, key) => {
        if ((edits as any)[key] !== (homeToEdit as any)[key]) {
          (acc as any)[key] = (edits as any)[key];
        }
        return acc;
      }, {} as Partial<newGroupHome>),
    };

    if (req.file?.buffer) {
      try {
        const result = await uploadToCloudinary(
          req.file.buffer,
          `${groupHome.name}/groupHome_images`,
          homeToEdit.cloudinary_public_id
        );

        groupHome.cloudinary_public_id = result.public_id;
        groupHome.image_url = result.secure_url;
        console.log(result);
      } catch (err) {
        console.log(err, 'cannot upload the file to cloudinary');
      }
    }

    const updatedGroupHome = await updateGroupHome(req.app.get('db'), id, groupHome);
    res.status(201).json({
      message: 'Group Home edited successfully',
      groupHome: updatedGroupHome,
    });
  } catch (error: any) {
    return next(new AppError(error.message || 'could not edit without a valid Id', 500));
  }
}

export async function getIndividualGroupHome(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('can not find groupHome without a valid Id', 400));
  }
  try {
    const home = await getSingleGroupHome(req.app.get('db'), id);
    if (!home) {
      return next(new AppError('No group home found with that ID', 404));
    }
    res.status(200).json({ groupHome: home });
  } catch (error: any) {
    return next(new AppError(error.message || 'could not find home without a valid Id', 500));
  }
}
