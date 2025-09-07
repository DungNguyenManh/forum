import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) { }

  async create(createUserDto: CreateUserDto) {
    const created = new this.userModel(createUserDto as any);
    return created.save();
  }

  findAll() {
    return this.userModel.find().lean();
  }

  findOne(id: string) {
    return this.userModel.findById(id).lean();
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).lean();
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id).lean();
  }
}
