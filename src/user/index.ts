import { Request, Response } from 'express';
import { Controller, handleError, queryParam } from 'express-ext';
import { Attributes, Log, Search } from 'onecore';
import { buildMap, buildToDelete, buildToInsert, buildToInsertBatch, buildToUpdate, DB, SearchBuilder, SearchResult, select, Service, Statement } from 'query-core';
import { TemplateMap, useQuery } from 'query-mappers';
import { User, UserFilter, userModel, UserService } from './user';

export * from './user';

export function useUserService(db: DB, mapper?: TemplateMap): UserService {
  const query = useQuery('user', mapper, userModel, true);
  const builder = new SearchBuilder<User, UserFilter>(db.query, 'users', userModel, db.driver, query);
  return new SqlUserService(builder.search, db);
}
export function useUserController(log: Log, db: DB, mapper?: TemplateMap): UserController {
  return new UserController(log, useUserService(db, mapper));
}

export class UserController extends Controller<User, string, UserFilter> {
  constructor(log: Log, private userService: UserService) {
    super(log, userService);
    this.array = ['status'];
    this.all = this.all.bind(this);
    this.getUsersOfRole = this.getUsersOfRole.bind(this);
  }
  all(req: Request, res: Response) {
    const v = req.query['roleId'];
    if (v && v.toString().length > 0) {
      this.userService.getUsersOfRole(v.toString())
        .then(users => res.status(200).json(users))
        .catch(err => handleError(err, res, this.log));
    } else {
      if (this.userService.all) {
        this.userService.all()
          .then(users => res.status(200).json(users))
          .catch(err => handleError(err, res, this.log));
      } else {
        res.status(400).end('roleId is required');
      }
    }
  }
  getUsersOfRole(req: Request, res: Response) {
    const id = queryParam(req, res, 'roleId');
    if (id) {
      this.userService.getUsersOfRole(id)
        .then(users => res.status(200).json(users))
        .catch(err => handleError(err, res, this.log));
    }
  }
}

const userRoleModel: Attributes = {
  userId: {
    key: true
  },
  roleId: {
    key: true
  },
};
interface UserRole {
  userId?: string;
  roleId: string;
}
export class SqlUserService extends Service<User, string, UserFilter> implements UserService {
  constructor(
    protected find: Search<User, UserFilter>,
    db: DB
  ) {
    super(find, db, 'users', userModel);
    this.search = this.search.bind(this);
    this.all = this.all.bind(this);
    this.insert = this.insert.bind(this);
    this.update = this.update.bind(this);
    this.patch = this.patch.bind(this);
    this.delete = this.delete.bind(this);
    this.map = buildMap(userModel);
  }
  getUsersOfRole(roleId: string): Promise<User[]> {
    if (!roleId || roleId.length === 0) {
      return Promise.resolve([]);
    }
    const q = `
      select u.*
      from userRoles ur
        inner join users u on u.userId = ur.userId
      where ur.roleId = ${this.param(1)}
      order by userId`;
    return this.query(q, [roleId], this.map);
  }
  search(s: UserFilter, limit?: number, offset?: number | string, fields?: string[]): Promise<SearchResult<User>> {
    return this.find(s, limit, offset, fields);
  }
  all(): Promise<User[]> {
    return this.query('select * from users order by userId asc', undefined, this.map);
  }
  load(id: string): Promise<User | null> {
    const stmt = select(id, 'users', this.primaryKeys, this.param);
    if (!stmt) {
      return Promise.resolve(null);
    }
    return this.query<User>(stmt.query, stmt.params, this.map)
      .then(users => {
        if (!users || users.length === 0) {
          return null;
        }
        const user = users[0];
        const q = `select roleId from userRoles where userId = ${this.param(1)}`;
        return this.query<UserRole>(q, [user.userId]).then(roles => {
          if (roles && roles.length > 0) {
            user.roles = roles.map(i => i.roleId);
          }
          return user;
        });
      });
  }
  insert(user: User): Promise<number> {
    const stmts: Statement[] = [];
    const stmt = buildToInsert(user, 'users', userModel, this.param);
    if (!stmt) {
      return Promise.resolve(-1);
    }
    stmts.push(stmt);
    insertUserRoles(stmts, user.userId, user.roles, this.param);
    return this.execBatch(stmts);
  }
  update(user: User): Promise<number> {
    const stmts: Statement[] = [];
    const stmt = buildToUpdate(user, 'users', userModel, this.param);
    if (!stmt) {
      return Promise.resolve(-1);
    }
    const query = `delete from userRoles where userId = ${this.param(1)}`;
    stmts.push({ query, params: [user.userId] });
    insertUserRoles(stmts, user.userId, user.roles, this.param);
    return this.exec(stmt.query, stmt.params);
  }
  patch(user: User): Promise<number> {
    return this.update(user);
  }
  delete(id: string): Promise<number> {
    const stmts: Statement[] = [];
    const query = `delete from userRoles where userId = ${this.param(1)}`;
    stmts.push({ query, params: [id] });
    const stmt = buildToDelete(id, 'users', this.primaryKeys, this.param);
    if (!stmt) {
      return Promise.resolve(-1);
    }
    stmts.push(stmt);
    return this.execBatch(stmts);
  }
}

function insertUserRoles(stmts: Statement[], userId: string, roles: string[] | undefined, param: (i: number) => string): Statement[] {
  if (roles && roles.length > 0) {
    const userRoles = roles.map<UserRole>(i => {
      const userRole: UserRole = { userId, roleId: i };
      return userRole;
    });
    const stmt = buildToInsertBatch(userRoles, 'userRoles', userRoleModel, param);
    if (stmt) {
      stmts.push(stmt);
    }
  }
  return stmts;
}
