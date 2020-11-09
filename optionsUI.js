// Saves options to localStorage.
function save_options() {
  var options = {};
  for (var opt in defOptions) {
    var select = document.getElementById(opt);
    if (select) {
      options[opt] = select.value;
    }
  }
  var optObj = {};
  optObj[OptionsKey] = options;
  appSettings.setSetting(optObj, (result) => {
    setStatus("Options Saved.");
  });
}

function setStatus(text) {
  var status = document.getElementById("status");
  status.innerHTML = text;
  setTimeout(function () {
    status.innerHTML = "";
  }, 750);
}

function restore_options() {
  var optJson = load_options((options) => {
    for (var opt in options) {
      var select = document.getElementById(opt);
      if (select) {
        select.value = options[opt];
      }
    }
    setStatus("Options Restored.");
  });
}

function reset_options() {
  appSettings.removeSetting(OptionsKey);
  restore_options();
}

function setOptionsUI() {
  window.document.addEventListener("DOMContentLoaded", restore_options);
  window.document
    .querySelector("#save")
    .addEventListener("click", save_options);
  window.document
    .querySelector("#reset")
    .addEventListener("click", reset_options);
}

setOptionsUI();
