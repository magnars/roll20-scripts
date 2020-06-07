/* global log, getObj, on, getAttrByName, sendChat, findObjs, createObj */

(function () {
  var regainedShortRest = ["Second Wind", "Action Surge", "Superiority Dice", "Channel Divinity"];
  var optionalShortRest = ["Arcane Recovery"];

  var regainedLongRest = ["Lay on Hands", "Divine Sense", "Arcane Recovery"].concat(regainedShortRest);

  function showStatus(msg) {
    sendChat("Status", msg, null, {noarchive:true});
  }

  function checkResources(charId, attr, actions, suggestions, regained, optional) {
    if (!attr || attr.get("current") === "" || attr.get("max") === "") { return; }

    try {
      var name = getAttrByName(charId, attr.get('name') + '_name');
    } catch (e) {
      return;
    }
    if (!name) { return; }

    var value = Number(attr.get('current'));
    var max = Number(attr.get('max'));

    if (regained.indexOf(name) !== -1) {
      if (value !== max) {
        attr.set({ current: max });
        if (max == 1) {
          actions.push(name + " regained.");
        } else {
          actions.push(`${name} regained (${value}->${max}).`);
        }
      }
    }

    if (optional.indexOf(name) !== -1) {
      if (value > 0) {
        suggestions.push("Consider using " + name + ".");
      }
    }
  }

  function checkResourceShortRest(charId, attr, actions, suggestions) {
    checkResources(charId, attr, actions, suggestions, regainedShortRest, optionalShortRest);
  }

  function checkResourceLongRest(charId, attr, actions, suggestions) {
    checkResources(charId, attr, actions, suggestions, regainedLongRest, []);
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

  function verified(token, attr, name) {
    if (!attr || attr.get("current") === "" || attr.get("max") === "") {
      showStatus(name + " attribute on " + token.get("name") + " is missing or current/max values are not filled out, skipped.");
      return false;
    }
    return true;
  }

  function shortRest(token) {
    var charId = token.get("represents");

    var hd = getAttr(charId, "hit_dice");
    var hp = getAttr(charId, "hp");

    if (!verified(token, hd, 'Hit dice')) { return; }
    if (!verified(token, hp, 'Hit points')) { return; }

    var max_hp = parseInt(hp.get("max"));
    var cur_hp = parseInt(hp.get("current"));
    var cur_hd = parseInt(hd.get("current"));

    var actions = [];
    var suggestions = [];

    // Check hit points and hit dice
    var msg = cur_hp == max_hp ? "You are at full hit points." : `You are down ${max_hp - cur_hp} hit points`;
    if (cur_hp < max_hp) {
      if (cur_hd == 0) {
        msg += " with no hit dice left.";
      } else {
        suggestions.push(`Consider using hit dice (${cur_hd} left).`);
      }
    }

    // Regain resources
    findResourceAttrs(charId).forEach(function (attr) {
      checkResourceShortRest(charId, attr, actions, suggestions);
    });

    // Notify player
    var points = actions.concat(suggestions);
    if (points.length) {
      msg += "<ul><li>" + points.join("</li><li>") + "</li></ul>";
    }
    sendChat("Short rest for " + token.get("name"), msg);
  }

  function longRest(token) {
    var charId = token.get("represents");

    var hd = getAttr(charId, "hit_dice");
    var hp = getAttr(charId, "hp");

    if (!verified(token, hd, 'Hit dice')) { return; }
    if (!verified(token, hp, 'Hit points')) { return; }

    var max_hp = Number(hp.get("max"));
    var cur_hp = Number(hp.get("current"));
    var max_hd = Number(hd.get("max"));
    var cur_hd = Number(hd.get("current"));

    var actions = [];
    var suggestions = [];

    // Regain hit points
    var msg = cur_hp == max_hp ? "You are already at full hit points." : `You regain ${max_hp - cur_hp} hit points, back at full (${max_hp}).`;
    if (cur_hp < max_hp) {
      hp.set({ current: max_hp });
    }

    // Regain hit dice
    if(cur_hd < max_hd) {
      var new_hd = Math.min(max_hd, cur_hd + Math.max(1, Math.floor(max_hd/2)));
      actions.push(`${new_hd - cur_hd} hit dice regained (now ${new_hd}/${max_hd}).`);
      hd.set({current: new_hd});
    }

    // Remove temporary hit points
    var temp_hp = getAttr(charId, "hp_temp");
    if (temp_hp) {
      var cur_temp_hp = temp_hp.get("current")
      if (cur_temp_hp != "" && cur_temp_hp > 0) {
        actions.push(`${temp_hp.get("current")} temporary hit points removed.`);
        temp_hp.set({current: ""});
      }
    }

    // Regain spell slots
    for (var i = 1; i < 10; i++) {
      var charslotmax = getAttr(charId, "lvl" + i + "_slots_total");
      var charslot = getAttr(charId, "lvl" + i + "_slots_expended");

      if (!charslotmax || !charslot) { continue; }
      if (charslotmax.get("current") === "" || charslot.get("current") === "") { continue; }

      var cur_slots = Number(charslot.get("current"));
      var max_slots = Number(charslotmax.get("current"));

      if(cur_slots < max_slots) {
        actions.push(`Level ${i} spell slots regained (${cur_slots}->${max_slots}).`);
        charslot.set({current: max_slots});
      }
    };

    // Regain resources
    findResourceAttrs(charId).forEach(function (attr) {
      checkResourceLongRest(charId, attr, actions, suggestions);
    });

    // Notify player
    var points = actions.concat(suggestions);
    if (points.length) {
      msg += "<ul><li>" + points.join("</li><li>") + "</li></ul>";
    }
    sendChat("Long rest for " + token.get("name"), msg);
  }

  on("ready", () => {
    on("chat:message", msg => {
      if (msg.type !== 'api') { return; }
      if (!msg.selected) { return; }

      var command = msg.content.split(" ")[0].toLowerCase();

      if (command === '!short-rest') {
        msg.selected.forEach(function (sel) {
          if (sel._type == "graphic") {
            var token = getObj(sel._type, sel._id);
            if (token && token.get("represents")) { shortRest(token); }
          }
        });
      }

      if (command === '!long-rest') {
        msg.selected.forEach(function (sel) {
          if (sel._type == "graphic") {
            var token = getObj(sel._type, sel._id);
            if (token && token.get("represents")) { longRest(token); }
          }
        });
      }
    });
  });

}());
