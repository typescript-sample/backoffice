export const config = {
  port: 8083,
  https: false,
  key: './config/key.pem',
  cert: './config/cert.pem',
  secure: false,
  cookie: false,
  allow: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: 'true',
    methods: 'GET,PUT,POST,DELETE,OPTIONS,PATCH',
    headers: 'Access-Control-Allow-Headers, Authorization, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers'
  },
  log: {
    level: 'debug',
    map: {
      time: '@timestamp',
      msg: 'message'
    },
    db: true
  },
  middleware: {
    log: true,
    skips: 'health,log',
    request: 'request',
    response: '',
    status: 'status',
    size: 'size'
  },
  ldap: {
    options: {
      url: 'ldap://fake-ldap.server.com:389'
    },
    dn: 'dc=example,dc=com',
    attributes: ['mail', 'displayName', 'uid'],
    map: {
      id: 'uid'
    },
    users: 'kaka,zinedine.zidane,gareth.bale'
  },
  db: {
    connectionString: 'postgres://hmacybye:gejWxp96CNZ41TjMPVqqAGZsrrhu7nRp@satao.db.elephantsql.com/hmacybye'
  },
  template: false,
  auth: {
    token: {
      secret: 'secretbackoffice',
      expires: 86400000
    },
    status: {
      success: 1
    },
    payload: {
      id: 'id',
      username: 'username',
      email: 'email',
      userType: 'userType'
    },
    account: {
      displayName: 'displayname'
    },
    userStatus: {
      activated: 'A',
      deactivated: 'D'
    },
    db: {
      user: 'users',
      password: 'passwords',
      id: 'id',
      username: 'username',
      status: 'status',
      successTime: '',
      failTime: '',
      failCount: '',
      lockedUntilTime: '',
    },
    query: 'select userId as id, username, email, displayname, status from users where username = $1',
  },
  sql: {
    allPrivileges: `
      select moduleId as id,
        moduleName as name,
        resourceKey as resource_key,
        path,
        icon,
        parent,
        sequence
      from modules
      where status = 'A'`,
    privileges: `
      select distinct m.moduleId as id, m.moduleName as name, m.resourceKey as resource,
        m.path, m.icon, m.parent, m.sequence, rm.permissions
      from users u
        inner join userRoles ur on u.userId = ur.userId
        inner join roles r on ur.roleId = r.roleId
        inner join roleModules rm on r.roleId = rm.roleId
        inner join modules m on rm.moduleId = m.moduleId
      where u.userId = $1 and r.status = 'A' and m.status = 'A'
      order by sequence`,
    permission: `
      select distinct rm.permissions
      from users u
        inner join userRoles ur on u.userId = ur.userId
        inner join roles r on ur.roleId = r.roleId
        inner join roleModules rm on r.roleId = rm.roleId
        inner join modules m on rm.moduleId = m.moduleId
      where u.userId = $1 and u.status = 'A' and r.status = 'A' and rm.moduleId = $2 and m.status = 'A'
      order by sequence`,
  }
};
export const env = {
  sit: {
    secure: true,
    log: {
      db: false
    },
    db: {
      database: 'masterdata_sit',
    }
  },
  prd: {
    secure: true,
    log: {
      db: false
    },
    middleware: {
      log: false
    }
  }
};
