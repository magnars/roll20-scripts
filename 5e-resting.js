/* global log, getObj, on, getAttrByName, sendChat, findObjs */

(function () {
  var replenishedShortRest = ["Second Wind", "Action Surge", "Superiority Dice", "Channel Divinity"];
  var optionalShortRest = ["Arcane Recovery"];

  function checkResourceShortRest(charId, attr, actions, suggestions) {
    try {
      var name = getAttrByName(charId, attr.get('name') + '_name');
    } catch (e) {
      return;
    }
    if (!name) { return; }

    var value = attr.get('current');
    var max = attr.get('max');

    if (replenishedShortRest.indexOf(name) !== -1) {
      if (value !== max) {
        attr.set({ current: max });
        if (max == 1) {
          actions.push(name + " regained.");
        } else {
          actions.push(`${name} regained (${value}->${max}).`);
        }
      }
    }

    if (optionalShortRest.indexOf(name) !== -1) {
      if (value > 0) {
        suggestions.push("Consider using " + name + ".");
      }
    }
  }

  function findResourceAttrs(charId) {
    return findObjs({
      type: 'attribute',
      characterid: charId
    }).filter(function (o) {
      var name = o.get('name') || '';
      return name === 'class_resource' ||
        name === 'other_resource' ||
        name.startsWith('repeating_resource_') && !name.endsWith('_name');
    });
  }

  function getAttr(charId, name) {
    return findObjs({
      type: 'attribute',
      characterid: charId,
      name: name
    }, {
      caseInsensitive: true
    })[0];
  }

  function shortRest(token) {
    var charId = token.get("represents");

    var hd = getAttr(charId, "hit_dice");
    var hp = getAttr(charId, "hp");

    var maxhp = parseInt(hp.get("max"));
    var curhp = parseInt(hp.get("current"));
    var curhd = parseInt(hd.get("current"));

    var msg = curhp == maxhp ? "You are at full hitpoints." : `You are down ${maxhp - curhp} hitpoints`;
    var actions = [];
    var suggestions = [];

    if (curhp < maxhp) {
      if (curhd == 0) {
        msg += " with no hit dice left.";
      } else {
        suggestions.push(`Consider using hit dice (${curhd} left).`);
      }
    }

    findResourceAttrs(charId).forEach(function (attr) {
      checkResourceShortRest(charId, attr, actions, suggestions);
    });

    var points = actions.concat(suggestions);
    if (points.length) {
      msg += "<ul><li>" + points.join("</li><li>") + "</li></ul>";
    }
    sendChat("Short rest for " + token.get("name"), msg);
  }

  on("ready", () => {
    on("chat:message", msg => {
      if (msg.type !== 'api') { return; }
      var command = msg.content.split(" ")[0].toLowerCase();

      if (command === '!short-rest') {
        if (!msg.selected) { return; }
        msg.selected.forEach(function (sel) {
          if (sel._type == "graphic") {
            var token = getObj(sel._type, sel._id);
            if (token && token.get("represents")) { shortRest(token); }
          }
        });
      }
    });
  });

}());
