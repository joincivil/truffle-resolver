var path = require("path");
var fs = require("fs");
var doWhilst = require("async/doWhilst");

function NPM(working_directory) {
  this.working_directory = working_directory;
};

// Needed to implement Node's module resolution algorith, as defined
// here: https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders
NPM.prototype.parent_directory = function(search_path) {
  const root_path = path.parse(search_path).root;
  if (search_path === root_path) {
    return null;
  }
  const new_path = path.join(path.resolve(search_path, ".."))
  return new_path;
}

NPM.prototype.require = function(import_path, search_path) {
  // Don't try to load relative-path contracts
  if (import_path.indexOf(".") == 0 || import_path.indexOf("/") == 0) {
    return null;
  }

  const separator = import_path.indexOf("/")
  const package_name = import_path.substring(0, separator);
  const contract_name = path.basename(import_path, ".sol");

  var current_dir = search_path || this.working_directory;
  do {
    const expected_path = path.join(current_dir, "node_modules", package_name, "build", "contracts", contract_name + ".json");
    try {
      const result = fs.readFileSync(expected_path, "utf8");
      return JSON.parse(result);
    } catch (e) {
      // Empty on purpouse
    }
    current_dir = this.parent_directory(current_dir);
  } while (current_dir !== null);
  return null;
};

NPM.prototype.resolve = function(import_path, imported_from, callback) {
  var current_directory = this.working_directory;
  doWhilst(
    function(next) {
      const expected_path = path.join(current_directory, "node_modules", import_path);
      current_directory = this.parent_directory(current_directory);
      return fs.readFile(expected_path, {encoding: "utf8"}, function (err, body) {
        // If there's an error, that means we can't read the source even if
        // it exists. Treat it as if it doesn't by ignoring any errors.
        // Perhaps we can do something better here in the future.
        return next(null, body);
      });
    }.bind(this),
    function(body) {
      return current_directory !== null && !body;
    },
    function(err, body_arr) {
      if (!body_arr) {
        return callback(err, null, import_path);
      }
      // Note: resolved_path is the import path because these imports are special.
      return callback(err, body_arr, import_path);
    }
  );
};

// We're resolving package paths to other package paths, not absolute paths.
// This will ensure the source fetcher conintues to use the correct sources for packages.
// i.e., if some_module/contracts/MyContract.sol imported "./AnotherContract.sol",
// we're going to resolve it to some_module/contracts/AnotherContract.sol, ensuring
// that when this path is evaluated this source is used again.
NPM.prototype.resolve_dependency_path = function(import_path, dependency_path) {
  var dirname = path.dirname(import_path);
  return path.join(dirname, dependency_path);
};

NPM.prototype.provision_contracts = function(callback) {
  // TODO: Fill this out!
  callback(null, {});
};


module.exports = NPM;
