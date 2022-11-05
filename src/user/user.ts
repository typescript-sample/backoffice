import { Attributes, Filter, Service } from 'onecore';

export interface UserFilter extends Filter {
  id?: string;
  username?: string;
  email?: string;
  phone?: string;
  status?: string;
  gender?: string;
  title?: string;
  position?: string;
}
export interface User {
  userId: string;
  username: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  roles?: string[];
}
export interface UserService extends Service<User, string, UserFilter> {
  all(): Promise<User[]>;
  getUsersOfRole(roleId: string): Promise<User[]>;
}

export const userModel: Attributes = {
  userId: {
    key: true,
    match: 'equal',
    length: 40
  },
  username: {
    required: true,
    length: 255,
    q: true,
    match: 'prefix'
  },
  email: {
    format: 'email',
    required: true,
    length: 120,
    q: true
  },
  displayName: {
    length: 120,
    q: true
  },
  status: {
    match: 'equal',
    length: 1
  },
  gender: {
    length: 1
  },
  phone: {
    format: 'phone',
    required: true,
    length: 14
  },
  title: {
    length: 10
  },
  position: {
    length: 10
  },
  imageURL: {
    length: 255
  },
  createdBy: {},
  createdAt: {
    type: 'datetime'
  },
  updatedBy: {},
  updatedAt: {
    type: 'datetime'
  },
  lastLogin: {
    type: 'datetime'
  },
  roles: {
    type: 'strings',
    ignored: true
  }
};
