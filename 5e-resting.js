/* global log, getObj, on, getAttrByName, sendChat, findObjs, createObj */

(function () {
  var regained = function (_) { return "regained"; };
  var consider = function (_) { return "consider"; };

  var getClassLevel = function (charId, className) {
    var s = getAttrByName(charId, 'class_display');
    if (s) {
      var m = s.match(new RegExp(className + " (\\d+)"));
      if (m && m.length > 0 && m[1]) {
        return Number(m[1]);
      }
    }
    return 0;
  };

  var afterClassLevel = function (className, minLevel, result) {
    return function (charId) {
      if (minLevel <= getClassLevel(charId, className)) {
        return result;
      }
    };
  };

  var resources = {
    // Barbarian
    "Rage": {longRest: regained},
    "Consult the Spirits": {longRest: regained},

    // Bard
    "Bardic Inspiration": {longRest: regained, shortRest: afterClassLevel("Bard", 5, "regained") },

    // Cleric
    "Channel Divinity": {longRest: regained, shortRest: regained},
    "Divine Intervention": {longRest: regained},
    "Warding Flare": {longRest: regained},
    "Wrath of the Storm": {longRest: regained},
    "War Priest": {longRest: regained},

    // Druid
    "Wild Shape": {longRest: regained, shortRest: regained},
    "Natural Recovery": {longRest: regained},

    // Fighter
    "Second Wind": {longRest: regained, shortRest: regained},
    "Action Surge": {longRest: regained, shortRest: regained},
    "Superiority Dice": {longRest: regained, shortRest: regained},
    "Indomitable": {longRest: regained},

    // Monk
    "Ki": {longRest: regained, shortRest: regained},
    "Wholeness of Body": {longRest: regained},

    // Paladin
    "Divine Sense": {longRest: regained},
    "Lay on Hands": {longRest: regained},
    "Cleansing Touch": {longRest: regained},
    "Holy Nimbus": {longRest: regained},
    "Undying Sentinel": {longRest: regained},
    "Elder Champion": {longRest: regained},
    "Avenging Angel": {longRest: regained},

    // Rogue
    "Stroke of Luck": {longRest: regained, shortRest: regained},
    "Spell Thief": {longRest: regained},

    // Sorcerer
    "Sorcery Points": {longRest: regained, shortRest: afterClassLevel("Sorcerer", 20, 4)},
    "Tides of Chaos": {longRest: regained},

    // Warlock
    "Hexblade’s Curse": {longRest: regained, shortRest: regained},
    "Accursed Specter": {longRest: regained},
    "Eldritch Master": {longRest: regained},
    "Fey Presence": {longRest: regained, shortRest: regained},
    "Misty Escape": {longRest: regained, shortRest: regained},
    "Dark Delirium": {longRest: regained, shortRest: regained},
    "Dark One's Own Luck": {longRest: regained, shortRest: regained},
    "Hurl Through Hell": {longRest: regained},
    "Entropic Ward": {longRest: regained, shortRest: regained},

    // Wizard
    "Arcane Recovery": {longRest: regained, shortRest: consider},
    "Arcane Ward": {longRest: regained},
    "Benign Transposition": {longRest: regained},
    "The Third Eye": {longRest: regained, shortRest: regained},
    "Illusory Self": {longRest: regained, shortRest: regained},
    "Shapechanger": {longRest: regained, shortRest: regained},

    // Race abilities
    "Breath Weapon": {longRest: regained}, // Dragonborn
    "Relentless Endurance": {longRest: regained}, // Half-orc
    "Githyanki Psionics": {longRest: regained}  // Githyaki
  };

  var warlockPactMagic = [
    null,                   // Warlock 0
    {slots: 1, level: 1},   // Warlock 1
    {slots: 2, level: 1},   // Warlock 2
    {slots: 2, level: 2},   // Warlock 3
    {slots: 2, level: 2},   // Warlock 4
    {slots: 2, level: 3},   // Warlock 5
    {slots: 2, level: 3},   // Warlock 6
    {slots: 2, level: 4},   // Warlock 7
    {slots: 2, level: 4},   // Warlock 8
    {slots: 2, level: 5},   // Warlock 9
    {slots: 2, level: 5},   // Warlock 10
    {slots: 3, level: 5},   // Warlock 11
    {slots: 3, level: 5},   // Warlock 12
    {slots: 3, level: 5},   // Warlock 13
    {slots: 3, level: 5},   // Warlock 14
    {slots: 3, level: 5},   // Warlock 15
    {slots: 3, level: 5},   // Warlock 16
    {slots: 4, level: 5},   // Warlock 17
    {slots: 4, level: 5},   // Warlock 18
    {slots: 4, level: 5},   // Warlock 19
    {slots: 4, level: 5},   // Warlock 20
  ];

  function showStatus(msg) {
    sendChat("Status", msg, null, {noarchive:true});
  }

  function checkResource(charId, attr, actions, suggestions, restType) {
    if (!attr || attr.get("current") === "" || attr.get("max") === "") { return; }

    var name = getAttrByName(charId, attr.get('name') + '_name');
    if (!name) { return; }

    var result;
    if (resources[name] && resources[name][restType]) {
      result = resources[name][restType](charId);
    } else if (name.endsWith('[s]') || (restType == "longRest" && name.endsWith('[l]'))) {
      name = name.substring(0, name.length-3);
      result = "regained";
    }
    if (!result) { return; }

    var value = Number(attr.get('current'));
    var max = Number(attr.get('max'));

    if (result == "regained") {
      if (value < max) {
        attr.set({ current: max });
        if (max == 1) {
          actions.push(name + " regained.");
        } else {
          actions.push(`${name} regained (${value}->${max}).`);
        }
      }
      return;
    }

    if (result == "consider") {
      if (value > 0) {
        suggestions.push("Consider using " + name + ".");
      }
      return;
    }

    if (result > 0) {
      if (value < max) {
        var newVal = Math.min(max, value + result);
        attr.set({ current: newVal });
        if (max == 1) {
          actions.push(name + " regained.");
        } else {
          actions.push(`${name} regained (${value}->${newVal}).`);
        }
      }
      return;
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

  function verifiedCurAndMax(token, attr, name) {
    if (!attr || attr.get("current") === "" || attr.get("max") === "") {
      showStatus(name + " attribute on " + token.get("name") + " is missing or current/max values are not filled out, skipped.");
      return false;
    }
    return true;
  }

  function regainSpellSlots(charId, spellLevel, toRegain, actions) {
    var charslotmax = getAttr(charId, "lvl" + spellLevel + "_slots_total");
    var charslot = getAttr(charId, "lvl" + spellLevel + "_slots_expended");

    if (!charslotmax || !charslot) { return; }
    if (charslotmax.get("current") === "" || charslot.get("current") === "") { return; }

    var cur_slots = Number(charslot.get("current"));
    var max_slots = Number(charslotmax.get("current"));

    var new_slots = toRegain == "regained" ? max_slots : Math.min(max_slots, cur_slots + toRegain);

    if(cur_slots < new_slots) {
      actions.push(`Level ${spellLevel} spell slots regained (${cur_slots}->${new_slots}).`);
      charslot.set({current: new_slots});
    }
  }

  function shortRest(token) {
    var charId = token.get("represents");

    var hd = getAttr(charId, "hit_dice");
    var hp = getAttr(charId, "hp");

    if (!verifiedCurAndMax(token, hd, 'Hit dice')) { return; }
    if (!verifiedCurAndMax(token, hp, 'Hit points')) { return; }

    var max_hp = Number(hp.get("max"));
    var cur_hp = Number(hp.get("current"));
    var cur_hd = Number(hd.get("current"));

    if (cur_hp == 0) {
      sendChat("Short rest for " + token.get("name"), "A character must have at least 1 hit point at the start of the rest to gain its benefits.<ul><li>Remember that a stable creature regains 1 hit point after 1d4 hours.</li></ul>");
      return;
    }

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

    // Warlock Pact Magic
    var warlockLevel = getClassLevel(charId, "Warlock");
    if (warlockLevel > 0) {
      var magic = warlockPactMagic[warlockLevel];
      regainSpellSlots(charId, magic.level, magic.slots, actions);
    }

    // Bard Song of Rest
    var bardLevel = getClassLevel(charId, "Bard");
    if (bardLevel > 1) {
      suggestions.push("Consider using Song of Rest.");
    }

    // Regain resources
    findResourceAttrs(charId).forEach(function (attr) {
      checkResource(charId, attr, actions, suggestions, 'shortRest');
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

    if (!verifiedCurAndMax(token, hd, 'Hit dice')) { return; }
    if (!verifiedCurAndMax(token, hp, 'Hit points')) { return; }

    var max_hp = Number(hp.get("max"));
    var cur_hp = Number(hp.get("current"));
    var max_hd = Number(hd.get("max"));
    var cur_hd = Number(hd.get("current"));

    if (cur_hp == 0) {
      sendChat("Long rest for " + token.get("name"), "A character must have at least 1 hit point at the start of the rest to gain its benefits.<ul><li>Remember that a stable creature regains 1 hit point after 1d4 hours.</li></ul>");
      return;
    }

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
      regainSpellSlots(charId, i, "regained", actions);
    };

    // Regain resources
    findResourceAttrs(charId).forEach(function (attr) {
      checkResource(charId, attr, actions, suggestions, 'longRest');
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

    log("5E OGL Resting in Style is ready! Select chars, then: !short-rest and !long-rest");
  });

}());
