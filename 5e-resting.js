/* global log, getObj, on, getAttrByName, sendChat, findObjs, createObj, randomInteger */

(function () {
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

  var if_zero_then_1 = function (charId, attr) {
    var current = attr.get("current");
    if (current == "" || current == "0") {
      return 1;
    }
  };

  var reset_to_1 = function () { return "reset:1"; };

  var regained = function (_) { return "regained"; };
  var consider = function (_) { return "consider"; };

  var only_long_rest = {longRest: regained};
  var long_and_short_rests = {longRest: regained, shortRest: regained};

  var resources = {
    // Artificer
    "flash of genius": only_long_rest,

    // Barbarian
    "rage": only_long_rest,
    "consult the spirits": only_long_rest,

    // Bard
    "bardic inspiration": {longRest: regained, shortRest: afterClassLevel("Bard", 5, "regained") },
    "enthralling performance": long_and_short_rests,
    "words of terror": long_and_short_rests,
    "unbreakable majesty": long_and_short_rests,
    "infectious inspiration": only_long_rest,
    "mantle of majesty": only_long_rest,
    "shadow lore": only_long_rest,
    "universal speech": only_long_rest,

    // Cleric
    "channel divinity": long_and_short_rests,
    "divine intervention": only_long_rest,
    "warding flare": only_long_rest,
    "wrath of the storm": only_long_rest,
    "war priest": only_long_rest,
    "war priest attack": only_long_rest,
    "visions of the past": long_and_short_rests,
    "embodiment of the law": only_long_rest,
    "eyes of the grave": only_long_rest,
    "sentinel at deaths door": only_long_rest,

    // Druid
    "wild shape": long_and_short_rests,
    "natural recovery": only_long_rest,
    "spirit totem": long_and_short_rests,
    "balm of the summer court": only_long_rest,
    "faithful summons": only_long_rest,
    "fungal infestation": only_long_rest,
    "hidden paths": only_long_rest,
    "walker in dreams": only_long_rest,

    // Fighter
    "second wind": long_and_short_rests,
    "action surge": long_and_short_rests,
    "superiority dice": long_and_short_rests,
    "indomitable": only_long_rest,
    "arcane shot": long_and_short_rests,
    "fighting spirit": only_long_rest,
    "strength before death": only_long_rest,
    "unwavering mark": only_long_rest,
    "warding maneuver": only_long_rest,

    // Monk
    "ki": long_and_short_rests,
    "ki points": long_and_short_rests,
    "wholeness of body": only_long_rest,

    // Paladin
    "divine sense": only_long_rest,
    "lay on hands": only_long_rest,
    "cleansing touch": only_long_rest,
    "holy nimbus": only_long_rest,
    "undying sentinel": only_long_rest,
    "elder champion": only_long_rest,
    "avenging angel": only_long_rest,
    "dread lord": only_long_rest,
    "emissary of redemption": only_long_rest,
    "glorious defense": only_long_rest,
    "invincible conqueror": only_long_rest,
    "living legend": only_long_rest,

    // Ranger
    "detect portal": long_and_short_rests,
    "ethereal step": long_and_short_rests,
    "magicusers nemesis": long_and_short_rests,
    "hunters sense": only_long_rest,

    // Rogue
    "stroke of luck": long_and_short_rests,
    "spell thief": only_long_rest,
    "unerring eye": only_long_rest,

    // Sorcerer
    "sorcery points": {longRest: regained, shortRest: afterClassLevel("Sorcerer", 20, 4)},
    "tides of chaos": only_long_rest,
    "favored by the gods": long_and_short_rests,
    "wind soul": long_and_short_rests,
    "strength of the grave": only_long_rest,
    "unearthly recovery": only_long_rest,

    // Warlock
    "hexblades curse": long_and_short_rests,
    "accursed specter": only_long_rest,
    "eldritch master": only_long_rest,
    "fey presence": long_and_short_rests,
    "misty escape": long_and_short_rests,
    "dark delirium": long_and_short_rests,
    "dark ones own luck": long_and_short_rests,
    "hurl through hell": only_long_rest,
    "entropic ward": long_and_short_rests,

    // Wizard
    "arcane recovery": {longRest: regained, shortRest: consider},
    "arcane ward": only_long_rest,
    "benign transposition": only_long_rest,
    "the third eye": long_and_short_rests,
    "illusory self": long_and_short_rests,
    "shapechanger": long_and_short_rests,
    "bladesong": long_and_short_rests,
    "arcane abeyance": long_and_short_rests,
    "chronal shift": only_long_rest,
    "event horizon": only_long_rest,
    "momentary stasis": only_long_rest,
    "power surge": {longRest: reset_to_1, shortRest: if_zero_then_1},
    "violent attraction": only_long_rest,

    // Race abilities
    "breath weapon": only_long_rest, // Dragonborn
    "relentless endurance": only_long_rest, // Half-orc
    "grovel, cower, and beg": long_and_short_rests, // Kobold
    "healing hands": only_long_rest, // Aasimar
    "fury of the small": long_and_short_rests, // Goblin
    "stones endurance": long_and_short_rests, // Goliath
    "saving face": long_and_short_rests, // Hobgoblin
    "hungry jaws": long_and_short_rests, // Lizardfolk
    "hidden step": long_and_short_rests, // Firbolg

    // Feats
    "lucky": only_long_rest
  };

  var fades = function (_) { return "fades"; };
  var fades_after_long_rest = {longRest: fades};
  var fades_after_short_rest = {longRest: fades, shortRest: fades};

  var modifiers = {
    // spells
    "aid": fades_after_long_rest,
    "armor of agathys": fades_after_short_rest,
    "aura of purity": fades_after_short_rest,
    "barkskin": fades_after_short_rest,
    "beacon of hope": fades_after_short_rest,
    "beast bond": fades_after_short_rest,
    "bladesong": fades_after_short_rest,
    "bless": fades_after_short_rest,
    "catnap": fades_after_short_rest,
    "ceremony": fades_after_short_rest,
    "circle of power": fades_after_short_rest,
    "crusaders mantle": fades_after_short_rest,
    "darkvision": fades_after_long_rest,
    "death ward": fades_after_long_rest,
    "divine favor": fades_after_short_rest,
    "dragons breath": fades_after_short_rest,
    "elemental weapon": fades_after_short_rest,
    "enhance ability": fades_after_short_rest,
    "enlargereduce": fades_after_short_rest,
    "enlarge reduce": fades_after_short_rest,
    "etherealness": fades_after_long_rest,
    "feign death": fades_after_short_rest,
    "fire shield": fades_after_short_rest,
    "flame arrows": fades_after_short_rest,
    "foresight": fades_after_long_rest,
    "fortunes favor": fades_after_short_rest,
    "freedom of movement": fades_after_short_rest,
    "friends": fades_after_short_rest,
    "gaseous form": fades_after_short_rest,
    "gift of alacrity": fades_after_long_rest,
    "greater invisibility": fades_after_short_rest,
    "guardian of nature": fades_after_short_rest,
    "guidance": fades_after_short_rest,
    "haste": fades_after_short_rest,
    "heroes feast": fades_after_short_rest,
    "heroism": fades_after_short_rest,
    "holy aura": fades_after_short_rest,
    "invisibility": fades_after_short_rest,
    "longstrider": fades_after_short_rest,
    "mage armor": fades_after_long_rest,
    "magic weapon": fades_after_short_rest,
    "motivational speech": fades_after_short_rest,
    "pass without trace": fades_after_short_rest,
    "protection from energy": fades_after_short_rest,
    "protection from evil and good": fades_after_short_rest,
    "protection from poison": fades_after_short_rest,
    "resistance": fades_after_short_rest,
    "sanctuary": fades_after_short_rest,
    "shadow of moil": fades_after_short_rest,
    "shield of faith": fades_after_short_rest,
    "shillelagh": fades_after_short_rest,
    "skill empowerment": fades_after_short_rest,
    "soul cage": fades_after_long_rest,
    "spider climb": fades_after_short_rest,
    "stoneskin": fades_after_short_rest,
    "swift quiver": fades_after_short_rest,
    "tensers transformation": fades_after_short_rest,
    "true polymorph": fades_after_short_rest,
    "warding bond": fades_after_short_rest,
    "wind walk": fades_after_long_rest,

    // class abilities
    "sacred weapon": fades_after_short_rest,
    "rage": fades_after_short_rest
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

  function resolveDice(txt) {
    const tokenize = /(\d+d\d+|\d+|\+|-)/ig;
    const dieparts = /^(\d+)?d(\d+)$/i;
    const ops = {
      '+': (m, n) => m + n,
      '-': (m, n) => m - n
    };
    let op = '+';

    return (txt.replace(/\s+/g, '').match(tokenize) || []).reduce((m, t) => {
      let matches = t.match(dieparts);
      if (matches) {
        return ops[op](m, [...Array(parseInt(matches[1]) || 1)].reduce(m => m + randomInteger(parseInt(matches[2])), 0));
      } else if (/^\d+$/.test(t)) {
        return ops[op](m, parseInt(t));
      } else {
        op = t;
        return m;
      }
    }, 0);
  }

  var normalize = function (s) {
    return s.toLowerCase().replace(/[^a-z ]+/g, "");
  };

  function checkModifier(charId, attr, faded, restType) {
    if (!attr || attr.get("current") === "") { return; }
    var name = getAttrByName(charId, attr.get('name').replace("_active_flag", "_name"));
    if (!name) { return; }
    var lcname = normalize(name);

    var result = modifiers[lcname] && modifiers[lcname][restType] && modifiers[lcname][restType](charId);

    if (result === 'fades' && attr.get("current") == "1") {
      faded.push(name);
      attr.setWithWorker({ current: "0" });
    }
  }

  function checkResource(charId, attr, actions, suggestions, restType) {
    if (!attr || attr.get("current") === "" || attr.get("max") === "") { return; }

    var name = getAttrByName(charId, attr.get('name') + '_name');
    if (!name) { return; }
    var lcname = normalize(name);

    var verb = "regained";
    var result;
    if (resources[lcname] && resources[lcname][restType]) {
      result = resources[lcname][restType](charId, attr);
    } else if (name.endsWith('[s]') || (restType == "longRest" && name.endsWith('[l]'))) {
      name = name.substring(0, name.length-3);
      result = "regained";
    } else if (name.match(/(.+)\[([sl])([0-9+-d]+)\]/)) {
      var ss = name.match(/(.+)\[([sl])([0-9+-d]+)\]/);
      if (restType == "shortRest" && ss[2] == "l") { return; }
      name = ss[1];
      result = resolveDice(ss[3]);
      verb = ss[3] + " rolled " + result + " ";
    }
    if (!result) { return; }

    var value = Number(attr.get('current'));
    var max = Number(attr.get('max'));

    if (result == "regained") {
      if (value < max) {
        attr.set({ current: max });
        if (max == 1) {
          actions.push(`${name} ${verb}.`);
        } else {
          actions.push(`${name} ${verb} (${value}→${max}).`);
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

    if (`${result}`.startsWith("reset:")) {
      var newVal = Number(result.substring(6));
      if (value != newVal) {
        attr.set({ current: newVal });
        actions.push(`${name} reset to ${newVal}.`);
      }
      return;
    }

    if (result > 0) {
      if (value < max) {
        var newVal = Math.min(max, value + result);
        attr.set({ current: newVal });
        if (max == 1) {
          actions.push(`${name} ${verb}.`);
        } else {
          actions.push(`${name} ${verb} (${value}→${newVal}).`);
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

  function findModifierAttrs(charId) {
    return findObjs({
      type: 'attribute',
      characterid: charId
    }).filter(function (o) {
      var name = o.get('name') || '';
      return (name.startsWith('repeating_acmod_') && name.endsWith('_global_ac_active_flag')) ||
        (name.startsWith('repeating_savemod_') && name.endsWith('_global_save_active_flag')) ||
        (name.startsWith('repeating_tohitmod_') && name.endsWith('_global_attack_active_flag')) ||
        (name.startsWith('repeating_skillmod_') && name.endsWith('_global_skill_active_flag')) ||
        (name.startsWith('repeating_damagemod_') && name.endsWith('_global_damage_active_flag'));
    });
  }

  function fadeBuffs(charId, actions, restType) {
    var faded = [];
    findModifierAttrs(charId).forEach(function (attr) {
      checkModifier(charId, attr, faded, restType);
    });
    [...new Set(faded)].forEach(function (name) {
      actions.push(name + " fades.");
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
      actions.push(`Level ${spellLevel} spell slots regained (${cur_slots}→${new_slots}).`);
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

    // Fade buffs
    fadeBuffs(charId, actions, 'shortRest');

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

    // Fade buffs
    fadeBuffs(charId, actions, 'longRest');

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
