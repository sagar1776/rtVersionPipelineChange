"use strict";

module.exports = (grunt) => {
  const path = require("path");

  const pkg = grunt.file.readJSON("package.json");

  // validate package version
  const semver = require("semver");
  if (!semver.valid(pkg.version)) {
    throw new Error(`package version is invalid: "${pkg.version}"`);
  }

  const extractFolder = (filePath) => path.basename(path.dirname(filePath));

  const VISUAL_DEV_RELEASE_VERSION = '<%= package.version %>';
  const VISUAL_DEV_RELEASE_SPRINT = '<%= package.release %>';

  // Extract version of JET lib from the npm package dependency
  // ojLib = <label>-<revision>
  // label is: <version>[-<release>]?
  // revision is: <date>_<time>, where
  // date is: <yyyy>-<mm>-<dd>, and
  // time is: <hh>-<mm>-<ss>
  const ojLib = extractFolder(pkg.dependencies["@oracle/oraclejet"], ".tgz");

  const ojLibSegments = ojLib.split("-");
  // there are 4 dashes in date&time, and one in front of them
  // everything in front is the label
  const ojLibLabel = ojLibSegments.slice(0, ojLibSegments.length - 5).join("-");
  const ojLibRevision = ojLibSegments.slice(ojLibSegments.length - 5).join("-");

  const OJ_LABEL_DEFAULT = ojLibLabel;
  const OJ_LABEL = grunt.option("oj-label") || OJ_LABEL_DEFAULT;
  const OJ_REVISION_DEFAULT = ojLibRevision;
  const OJ_REVISION = grunt.option("oj-revision") || OJ_REVISION_DEFAULT;
  const OJ_CDN_DEFAULT = "https://static.oracle.com/cdn/jet/";
  const OJ_CDN = grunt.option("oj-cdn") || OJ_CDN_DEFAULT;
  const OJ_VERSION = {
    // TODO: This should be kept in sync with package.json::@oracle/oraclejet
    // But, the artifactory url is _not_ the cdn path.
    version: OJ_LABEL,
    revision: OJ_REVISION,
    cdnPath: OJ_CDN,
  };

  // See: https://confluence.oraclecorp.com/confluence/display/JET/JET+Dynamic+UI+Drops+for+VB+Applications#JETDynamicUIDropsforVBApplications-WebdriverAutomation
  // Extract version of oj-dynamic/oj-dyn from the corresponding webrdiver npm package dependency
  const ojDynLib = path.basename(
    pkg.devDependencies["@oracle/oj-dynamic-webdriver"],
    ".tgz",
  );
  // everything after "webdriver-" is the version number
  const ojDynLibVersion = ojDynLib.match(/webdriver-(.*)/)[1];

  const OJ_DYNAMIC_LABEL_DEFAULT = ojDynLibVersion;
  const OJ_DYNAMIC_LABEL =
    grunt.option("oj-dynamic-label") || OJ_DYNAMIC_LABEL_DEFAULT;
  const OJ_DYNAMIC_CDN_DEFAULT =
    "https://static.oracle.com/cdn/jet/packs/oj-dynamic/";
  const OJ_DYNAMIC_CDN =
    grunt.option("oj-dynamic-cdn") || OJ_DYNAMIC_CDN_DEFAULT;
  const OJ_DYNAMIC_VERSION = {
    version: OJ_DYNAMIC_LABEL,
    cdnPath: OJ_DYNAMIC_CDN,
  };

  const OJ_DYN_LABEL_DEFAULT = ojDynLibVersion;
  const OJ_DYN_LABEL = grunt.option("oj-dyn-label") || OJ_DYN_LABEL_DEFAULT;
  const OJ_DYN_CDN_DEFAULT = "https://static.oracle.com/cdn/jet/packs/oj-dyn/";
  const OJ_DYN_CDN = grunt.option("oj-dyn-cdn") || OJ_DYN_CDN_DEFAULT;
  const OJ_DYN_VERSION = {
    version: OJ_DYN_LABEL,
    cdnPath: OJ_DYN_CDN,
  };

  // boss transforms loader
  const BOSS_LABEL_DEFAULT = "2501.0.7450";
  const BOSS_LABEL = grunt.option("boss-label") || BOSS_LABEL_DEFAULT;
  const BOSS_CDN_DEFAULT = "https://static.oracle.com/cdn/boss/";
  const BOSS_CDN = grunt.option("boss-cdn") || BOSS_CDN_DEFAULT;
  const BOSS_VERSION = {
    version: BOSS_LABEL,
    cdnPath: BOSS_CDN,
  };

  // Process telemetry options
  // Use the wiki below to find these options
  // https://confluence.oraclecorp.com/confluence/display/REX/RedwoodJS+Stripe+Release+Schedule
  const TELEMETRY_CDN_DEFAULT = "https://static.oracle.com/cdn/trace/";
  const TELEMETRY_LABEL_DEFAULT = extractFolder(
    pkg.devDependencies["telemetry-webdriver"],
  );
  const TELEMETRY_VERSION = {
    cdnPath: grunt.option("telemetry-cdn") || TELEMETRY_CDN_DEFAULT,
    version: grunt.option("telemetry-label") || TELEMETRY_LABEL_DEFAULT,
  };

  // See docs/upgradingWorkbox.md for upgrade instructions
  const WORKBOX_VERSION = '<%= package.devDependencies["workbox-build"] %>';
  const WORKBOX_CDN_PATH = "https://static.oracle.com/cdn/vb/workbox/releases/";

  // see tests/tscGruntTasks.js for details
  // to see # of actual errors, please run: grunt ts:src
  const EXPECTED_NUMBER_OF_TSC_ERRORS = 1000;

  // See https://jira.oraclecorp.com/jira/browse/VBS-32632
  // The defult name __awaiter is too common
  // The options are
  // 1. Ask all spectra partners to use the same library. In theory everyone could consume the same
  // telemetry library.
  // 2. Dont use the transpiler
  // 3. Ask Kevin to consume oars's version of the library and we consume this change, but oars can
  // change their implementation any time and we will be out of sync again.
  // 4. Change our impl to use a different awaiter global name
  // We are going with option (4).
  const AWAITER_GLOBAL_NAME = "__awaiterVbrt";

  // We are now using JitGrunt via load-grunt-config which loads only tasks that are needed for current Grunt command.
  // require('load-grunt-tasks')(grunt); // Load grunt tasks automatically
  require("time-grunt")(grunt); // Time how long tasks take. Can help when optimizing build times

  // Modular loading for grunt config. All defaults should be here.
  // see https://www.npmjs.com/package/load-grunt-config
  // * loads all npm tasks
  // * loads config
  // * expose package.json
  // * init config
  require("load-grunt-config")(grunt, {
    // path to <task-name>.js config files
    configPath: path.join(process.cwd(), "grunt", "config"),

    // Use JIT Grunt to load grunt npm tasks on demand
    jitGrunt: {
      // other then in the node_modules, tasks are searched for in this custom tasks folder
      customTasksDir: "grunt/tasks",
      // some npm packages do not use stadard naming that maps into task names,
      // for them we need to provide custom mappings
      staticMappings: {
        express: "grunt-express-server",
        configureProxies: "grunt-connect-proxy3",
        "curl-dir": "grunt-curl",
      },
    },

    loadGruntTasks: false,

    // data passed into config.  Make these shared variables available for other modular config files
    //
    // In grunt/config/<task-name>.js files this value is passed as the second "options" parameter and
    // can be accessed directly:
    //  module.exports = (grunt, options) => {
    //    const v = options.VISUAL_DEV_RELEASE_VERSION;
    //  }
    //
    // It can also be accessed directly using Grunt expression: '<%= VISUAL_DEV_RELEASE_VERSION %>'
    //
    // After all configuration files are processed, it is then merged into grunt.config data.
    // In the task files grunt/tasks/<task-name>.js it is available
    //    module.exports = (grunt) => {
    //       const v = grunt.config.get('VISUAL_DEV_RELEASE_VERSION')
    //    }
    //
    data: {
      VISUAL_DEV_RELEASE_VERSION,
      VISUAL_DEV_RELEASE_SPRINT,
      VISUAL_DEV_RELEASE_LIB_NAME: "visual-runtime",

      // TODO take this from Jet via AMD dependency
      OJ_LABEL_DEFAULT,
      OJ_LABEL,
      OJ_REVISION_DEFAULT,
      OJ_REVISION,
      OJ_CDN_DEFAULT,
      OJ_CDN,
      OJ_VERSION,

      BOSS_VERSION,

      OJ_DYNAMIC_LABEL_DEFAULT,
      OJ_DYNAMIC_LABEL,
      OJ_DYNAMIC_CDN_DEFAULT,
      OJ_DYNAMIC_CDN,
      OJ_DYNAMIC_VERSION,
      OJ_DYNAMIC: OJ_DYNAMIC_CDN + OJ_DYNAMIC_LABEL,

      OJ_DYN_LABEL_DEFAULT,
      OJ_DYN_LABEL,
      OJ_DYN_CDN_DEFAULT,
      OJ_DYN_CDN,
      OJ_DYN_VERSION,

      // Process telemetry options
      // Use the wiki below to find these options
      // https://confluence.oraclecorp.com/confluence/display/REX/RedwoodJS+Stripe+Release+Schedule
      TELEMETRY_CDN_DEFAULT,
      TELEMETRY_LABEL_DEFAULT,
      TELEMETRY_VERSION,

      // See docs/upgradingWorkbox.md for upgrade instructions
      WORKBOX_VERSION,
      WORKBOX_CDN_PATH,

      EXPECTED_NUMBER_OF_TSC_ERRORS,

      AWAITER_GLOBAL_NAME,
    },
  });

  //-----------
  // TODO: move out of Gruntfile.js <START>
  //-----------

  // Please add individual configurations to grunt/config/<config name> directory.
  // For example, the writefile configuration can be moved to grunt/config/writefile.js.
  // Please look at grunt/config/requirejs.js for an example.

  /**
   * A simple task that lists build configuration for jet and related variables managed by grunt.
   */
  grunt.registerTask("list-params", (driver) => {
    // eslint-disable-line no-unused-vars
    grunt.log.writeln(
      `OJET Configuration: ${JSON.stringify(OJ_VERSION, null, 2)}`,
    );
    grunt.log.writeln(
      `OJET Dynamic Configuration: ${JSON.stringify(OJ_DYNAMIC_VERSION, null, 2)}`,
    );
    grunt.log.writeln(
      `OJET Dyn Configuration: ${JSON.stringify(OJ_DYN_VERSION, null, 2)}`,
    );
    grunt.log.writeln(
      `Telemetry Configuration: ${JSON.stringify(TELEMETRY_VERSION, null, 2)}`,
    );
    grunt.log.writeln(
      `BOSS Configuration: ${JSON.stringify(BOSS_VERSION, null, 2)}`,
    );
  });

  grunt.registerTask("cwd", () => {
    grunt.log.ok(process.cwd());
    return true;
  });

  //-----------
  // TODO: move out of Gruntfile.js <END>
  //-----------

  /**
   * Show help by default
   */
  grunt.registerTask("default", grunt.help.display);

  // TODO: The old tasks directory is deprecated. Please add new tasks to the grunt/tasks directory.
  // All of those tasks should be refactored into corresponding grunt/config/*.js and grunt/tasks/*.js
  grunt.loadTasks("grunt/tasks/custom");
};
