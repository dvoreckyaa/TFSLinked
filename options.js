var defOptions = {
  contentSelector: "div.issue-body-content,div.ak-renderer-document",
  descriptionQuery:
    "td:containsIN('Changeset:'):containsIN('Modified Files:'),p:containsIN('Changeset:'),p:containsIN('Changeset:'):containsIN('Modified Files:')",
  tfsFilePattern:
    "<a href='http://mps-tfs-main:8080/tfs/E10Dev/ERP/_versionControl?path={0}' target='_blank'>{1}</a>",
  changesetPattern:
    "<a href='http://mps-tfs-main:8080/tfs/E10Dev/ERP/_versionControl/changeset/{0}' target='_blank'>{0}</a>",
};

const OptionsKey = "TFSLinked";

var appSettings = new (function () {
  this.browser = () => (window.browser ? window.browser : window.chrome);
  this.appStorage = () => this.browser().storage.local;
  this.appStorage = () => this.browser().storage.local;
  this.getSetting = (key, callback) => this.appStorage().get(key, callback);
  this.setSetting = (options, callback) => {
    this.appStorage().set(options, function (result) {
      console.log("TFSLinked options", result);
      if (callback) {
        callback(result);
      }
    });
  };
  this.removeSetting = (key) =>
    this.appStorage().remove(key, function (result) {
      console.log("TFSLinked options", result);
    });
})();

function load_options(callback) {
  appSettings.getSetting([OptionsKey], (opt) => {
    var optJson = { ...defOptions, ...opt[OptionsKey] };
    callback(optJson);
  });
}
