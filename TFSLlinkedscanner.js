window.onload = function () {
  var linkScanner = new createlinkScanner();
  setTimeout(() => {
    createCopyToClipboardButtons();
  }, 1000);
};

var globalOptions = {};

function getiIsOldStructure() {
  //const urlParams = new URLSearchParams(window.location.search);
  //const oldIssueView = urlParams.get("oldIssueView") || "";
  //console.log("oldIssueView", oldIssueView);
  // return oldIssueView.toUpperCase() === "true";
  return $("#summary-val").length > 0;
}

function createCopyToClipboardButtons() {
  let $sum = $("#summary-val");
  let isOldStructure = true;
  if ($sum.length == 0) {
    isOldStructure = false;
    $sum = $(
      "[data-test-id='issue.views.issue-base.foundation.summary.heading']"
    );
  }
  var $btnDiv = $("<div />");
  applyStyles($btnDiv);
  if (isOldStructure) {
    $sum.after($btnDiv);
  } else {
    $sum.parents("div[class*='RootWrapper']").after($btnDiv);
  }
  $btnDiv.append(
    '<button type="button" id="copySummaryToClipboard">Copy To Clipboard</button>'
  );
  $btnDiv.append(
    '<button type="button" id="copySummaryToClipboardAsLink">Copy To Clipboard as Link</button>'
  );
  if (isOldStructure) {
    var $key = $("#key-val");
    $("#copySummaryToClipboard").click(function () {
      copyToClipboard($key.text() + " - " + $sum.text());
    });
    $("#copySummaryToClipboardAsLink").click(function () {
      var link = $($key).attr("href");
      copyLinkToClipboard($key.text() + " - " + $sum.text(), link);
    });
  } else {
    $btnDiv.append(
      '<button type="button" id="switchToTheOldView">Switch to the old view</button>'
    );

    let $key = $(
      "[data-test-id='issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container']"
    ).last();

    $("#copySummaryToClipboard").click(function () {
      copyToClipboard($key.text() + " - " + $sum.text());
    });
    $("#copySummaryToClipboardAsLink").click(function () {
      var link = $($key).find("a").attr("href");
      copyLinkToClipboard($key.text() + " - " + $sum.text(), link);
    });
    $("#switchToTheOldView").click(function () {
      var url = new URL(window.location.href);
      url.searchParams.append("oldIssueView", "true");
      document.location.replace(url);
    });
  }
  return isOldStructure;
}

function creteInvisibleElem(tag) {
  const elem = document.createElement(tag);
  elem.style.position = "fixed";
  elem.style.opacity = 0;
  document.body.appendChild(elem);
  return elem;
}

function copyToClipboard(text) {
  const elem = creteInvisibleElem("input");
  elem.value = text;
  elem.select();
  document.execCommand("Copy");
  document.body.removeChild(elem);
  console.log("copyToClipboard", text);
}

function copyLinkToClipboard(text, href) {
  const link = creteInvisibleElem("a");
  link.text = text;
  link.href = href;
  const range = document.createRange();
  range.selectNode(link);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  console.log("copyLinkToClipboard", text, href);
  const successful = document.execCommand("copy");
}

function createLinkToTFSFile(text) {
  //TODO: works incorrectly when a path contains whitespace
  //([^\S]|^)((\$\/ERP\/?)(.*$))
  return (text || "").replace(
    /([^\S]|^|>)((\$\/ERP\/?)(\S+))/gi,
    function (match, space, url) {
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
    }
  );
}

function createlinkScanner() {
  load_options((options) => {
    globalOptions = options;
    $(globalOptions.contentSelector)
      .toArray()
      .forEach((element) => {
        applyStyles(element);
        createLinks($(element), globalOptions);
        registerObserver(element);
      });
  });
}

function applyStyles(element) {
  let $element = $(element);
  $element.css("border", "1px dashed red");
}

function createLinks($parentElem) {
  $parentElem = $($parentElem);
  let isOldStructure = getiIsOldStructure();
  var descElements = isOldStructure
    ? $parentElem.find(globalOptions.descriptionQuery).parent().toArray()
    : [$parentElem[0]];
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
      var iEnd = innerText.indexOf("modified files:", iStart);
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
