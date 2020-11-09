window.onload = function () {
  var linkScanner = new createlinkScanner();
};

var globalOptions = {};

function createLinkToTFSFile(text) {
  //TODO: works incorrectly when a path contains whitespace
  //([^\S]|^)((\$\/ERP\/?)(.*$))
  return (text || "").replace(/([^\S]|^)((\$\/ERP\/?)(\S+))/gi, function (
    match,
    space,
    url
  ) {
    let hyperlink = url;
    if (!hyperlink.match("^$/ERP?/://")) {
      //hyperlink = 'http://mps-tfs-main:8080/tfs/E10Dev/ERP/_versionControl?path=' + hyperlink;
      var parsedUrl = url
        .replace(" branch", "")
        .replace(" edit", "")
        .replace(" rename", "")
        .replace(" add", "")
        .replace(" delete", "");
      hyperlink = globalOptions.tfsFilePattern
        .split("{0}")
        .join(parsedUrl)
        .split("{1}")
        .join(url);
    }
    return space + hyperlink;
  });
}

function createlinkScanner() {
  load_options((options) => {
    globalOptions = options;
    $(globalOptions.contentSelector)
      .toArray()
      .forEach((element) => {
        createLinks($(element), globalOptions);
        registerObserver(element);
      });
  });
}

function createLinks($parentElem) {
  $parentElem = $($parentElem);
  var descElements = $parentElem.find(globalOptions.descriptionQuery).toArray();
  for (var idx in descElements) {
    var elem = descElements[idx];
    var $elem = $(elem);
    var htmlText = $elem.html();
    var innerText = elem.innerText.toLowerCase();
    var iStart = innerText.indexOf("changeset:") + "changest:".length;
    var iEnd = innerText.indexOf("modified files:", iStart);
    var prevStart = 0;
    var prevEnd = 0;
    while (iStart >= prevStart && iEnd >= prevEnd) {
      var textToBeReplaced = elem.innerText.substring(iStart + 1, iEnd);
      var changestArray = textToBeReplaced.trim().split(",");
      for (var idx1 in changestArray) {
        var changestNum = parseInt(changestArray[idx1].trim());
        if (!isNaN(changestNum)) {
          var textToReplace = globalOptions.changesetPattern
            .split("{0}")
            .join(changestNum);
          //TODO : text has to be replaced only inside iStart, iEnd
          htmlText = htmlText.split(changestNum).join(textToReplace);
        }
      }
      prevStart = iStart;
      prevEnd = iEnd;
      var iStart =
        innerText.indexOf("changeset:", prevStart) + "changest:".length;
      var iEnd = innerText.indexOf("modified files:", prevStart);
    }
    var htmlText = createLinkToTFSFile(htmlText);
    $elem.html(htmlText);
  }
}

function registerObserver(parentElem) {
  let observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        createLinks(node);
      }
    }
  });
  observer.observe(parentElem, { childList: true, subtree: true });
}

$.extend($.expr[":"], {
  containsIN: function (elem, i, match, array) {
    return (
      (elem.textContent || elem.innerText || "")
        .toLowerCase()
        .indexOf((match[3] || "").toLowerCase()) >= 0
    );
  },
});
