var path = require("path");
var fs = require("fs");

function FS(working_directory, contracts_build_directory) {
  this.working_directory = working_directory;
  this.contracts_build_directory = contracts_build_directory;
}

FS.prototype.require = function(import_path, search_path) {
  var contract_name = path.basename(import_path, ".sol");

  search_path = search_path || this.contracts_build_directory;

  // If we have an absoulte path, only check the file if it's a child of the working_directory.
  if (path.isAbsolute(import_path)) {
    if (import_path.indexOf(this.working_directory) != 0) {
      return null;
    }
    import_path = "./" + import_path.replace(this.working_directory);
  }

  try {
    var result = fs.readFileSync(path.join(search_path, contract_name + ".json"), "utf8");
    return JSON.parse(result);
  } catch (e) {
    return null;
  }
};

FS.prototype.resolve = function(import_path, callback) {
  var expected_path = path.resolve(import_path);

  fs.readFile(expected_path, {encoding: "utf8"}, function(err, body) {
    // If there's an error, that means we can't read the source even if
    // it exists. Treat it as if it doesn't by ignoring any errors.
    // Perhaps we can do something better here in the future.
    return callback(null, body);
  })
};

// Here we're resolving from local files to local files, all absolute.
FS.prototype.resolve_dependency_path = function(import_path, dependency_path) {
  var dirname = path.dirname(import_path);
  return path.resolve(path.join(dirname, dependency_path));
};


module.exports = FS;