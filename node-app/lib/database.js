const fs = require("fs");
const path = require("path");

const defaultData = {
  version: 1,
  sessions: {},
  students: {},
  progress: {},
  adminSettings: {
    portalTitle: "PR Media LLC & Tapoos Courses",
    instructorName: "Haris Sajjad",
    supportEmail: "haris@tapoos.dev",
  },
  auditLog: [],
};

class JsonDatabase {
  constructor(file) {
    this.file = path.resolve(process.cwd(), file);
    this.ensure();
  }

  ensure() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, JSON.stringify(defaultData, null, 2));
    }
  }

  read() {
    this.ensure();
    return JSON.parse(fs.readFileSync(this.file, "utf8"));
  }

  write(data) {
    const temp = `${this.file}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(data, null, 2));
    fs.renameSync(temp, this.file);
  }

  update(mutator) {
    const data = this.read();
    const result = mutator(data);
    this.write(data);
    return result;
  }

  createSession(sessionId, payload) {
    return this.update((data) => {
      data.sessions[sessionId] = payload;
      data.auditLog.push({
        type: "login",
        sessionId,
        createdAt: payload.createdAt,
      });
      return data.sessions[sessionId];
    });
  }

  getSession(sessionId) {
    const data = this.read();
    return data.sessions[sessionId] || null;
  }

  deleteSession(sessionId) {
    this.update((data) => {
      delete data.sessions[sessionId];
    });
  }

  getAdminSettings() {
    return this.read().adminSettings;
  }

  saveAdminSettings(settings) {
    return this.update((data) => {
      data.adminSettings = {
        ...data.adminSettings,
        ...settings,
      };
      data.auditLog.push({
        type: "admin_settings_update",
        createdAt: new Date().toISOString(),
      });
      return data.adminSettings;
    });
  }

  saveProgress(sessionId, payload) {
    return this.update((data) => {
      data.progress[sessionId] = {
        ...data.progress[sessionId],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      return data.progress[sessionId];
    });
  }

  getProgress(sessionId) {
    return this.read().progress[sessionId] || {};
  }
}

module.exports = {
  JsonDatabase,
};
