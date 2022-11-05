import { AuthenticationController, PrivilegeController } from 'authen-express';
import { initializeStatus, PrivilegeRepository, PrivilegesReader, SqlAuthConfig, useAuthenticator, User, useUserRepository } from 'authen-service';
import { HealthController, LogController, Logger, Middleware, MiddlewareController, resources, Search, useSearchController } from 'express-ext';
import { buildJwtError, generate, Payload, verify } from 'jsonwebtoken-plus';
import { Conf, useLDAP } from 'ldap-plus';
import { createChecker, DB, SearchBuilder, useGet } from 'query-core';
import { TemplateMap } from 'query-mappers';
import { Authorize, Authorizer, PrivilegeLoader, useToken } from 'security-express';
import { check } from 'types-validation';
import { createValidator } from 'xvalidators';
import { AuditLog, AuditLogFilter, auditLogModel } from './audit-log';
import { RoleController, useRoleController } from './role';
import { UserController, useUserController } from './user';

resources.createValidator = createValidator;
resources.check = check;

export interface Config {
  cookie?: boolean;
  ldap: Conf;
  auth: SqlAuthConfig;
  sql: {
    allPrivileges: string;
    privileges: string;
    permission: string;
  };
}
export interface Context {
  health: HealthController;
  log: LogController;
  middleware: MiddlewareController;
  authorize: Authorize;
  authentication: AuthenticationController<User>;
  privilege: PrivilegeController;
  role: RoleController;
  user: UserController;
  auditLog: Search;
}
export function useContext(db: DB, logger: Logger, midLogger: Middleware, conf: Config, mapper?: TemplateMap): Context {
  const auth = conf.auth;
  const log = new LogController(logger);
  const middleware = new MiddlewareController(midLogger);
  const sqlChecker = createChecker(db);
  const health = new HealthController([sqlChecker]);
  const privilegeLoader = new PrivilegeLoader(conf.sql.permission, db.query);
  const token = useToken<Payload>(auth.token.secret, verify, buildJwtError, conf.cookie);
  const authorizer = new Authorizer<Payload>(token, privilegeLoader.privilege, buildJwtError, true);

  const status = initializeStatus(auth.status);
  const privilegeRepository = new PrivilegeRepository(db.query, conf.sql.privileges);
  const userRepository = useUserRepository<string, SqlAuthConfig>(db, auth);
  const authenticate = useLDAP(conf.ldap, status);
  const authenticator = useAuthenticator(status, authenticate, generate, auth.token, auth.payload, auth.account, userRepository, privilegeRepository.privileges, auth.lockedMinutes, auth.maxPasswordFailed);
  const authentication = new AuthenticationController(logger.error, authenticator.authenticate, conf.cookie);
  const privilegesLoader = new PrivilegesReader(db.query, conf.sql.allPrivileges);
  const privilege = new PrivilegeController(logger.error, privilegesLoader.privileges);

  const role = useRoleController(logger.error, db, mapper);
  const user = useUserController(logger.error, db, mapper);

  const builder = new SearchBuilder<AuditLog, AuditLogFilter>(db.query, 'auditlog', auditLogModel, db.driver);
  const getAuditLog = useGet<AuditLog, string>(db.query, 'auditlog', auditLogModel, db.param);
  const auditLog = useSearchController(logger.error, builder.search, getAuditLog, ['status'], ['timestamp']);
  // const auditLog = useAuditLogController(logger.error, db);

  return { health, log, middleware, authorize: authorizer.authorize, authentication, privilege, role, user, auditLog };
}
