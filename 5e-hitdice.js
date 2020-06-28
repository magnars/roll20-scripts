/* global findObjs, log, sendChat, on, _, TokenMod */

(function () {
  let observers = { tokenChange: [] };

  const observeTokenChange = function (handler) {
    if (handler && _.isFunction(handler)) {
      observers.tokenChange.push(handler);
    }
  };

  const notifyObservers = function (event, obj, prev) {
    _.each(observers[event], function (handler) {
      handler(obj,prev);
    });
  };

  const sendRollTemplate = function (id, msg) {
    sendChat(
      id,
      "<div class='sheet-rolltemplate-simple'><div class='sheet-container'><div class='sheet-label' style='padding:5px 10px;'><span>" +
        msg +
        "</span></div></div></div>"
    );
  };

  const warn = function (msg) {
    log("[5e-hitdice]: " + msg);
  };

  const getAttr = function (charId, name) {
    return findObjs({
      type: 'attribute',
      characterid: charId,
      name: name
    }, { caseInsensitive: true })[0];
  };

  const findCharacterTokens = function (charId) {
    return findObjs({
      type: 'graphic',
      represents: charId
    });
  };

  const clone = function (o) {
    return JSON.parse(JSON.stringify(o));
  };

  const handlehd = function (msg, character) {
    var hd = getAttr(character.id, "hit_dice");
    var hp = getAttr(character.id, "hp");
    var name = character.get("name");

    if (!hd || hd.get("current") === "" || hd.get("max") === "") {
      sendRollTemplate(msg.who, "Hit dice attribute on " + name + " is missing or current/max values are not filled out, hit points were not applied.");
      return;
    }
    if (!hp || hp.get("current") === "" || hp.get("max") === "") {
      sendRollTemplate(msg.who, "Hit point attribute on " + name + " is missing or current/max values are not filled out, hit points were not applied.");
      return;
    }

    var cur_hd = Number(hd.get("current"));
    var max_hp = Number(hp.get("max"));
    var cur_hp = Number(hp.get("current"));

    if (cur_hd === 0) {
      sendRollTemplate(msg.who, name + " has no hit dice remaining.");
      return;
    }
    if (cur_hp === max_hp) {
      sendRollTemplate(msg.who, name + " already at full hit points, no hit dice used.");
      return;
    }

    var result = msg.inlinerolls[2].results.total ? msg.inlinerolls[2].results.total : false;
    if (result === false) {
      warn("FAILED to extract hit dice result from chat message.");
      return;
    }

    var tokens = findCharacterTokens(character.id);
    var prevTokens = tokens.map(clone);

    hd.setWithWorker({ current: cur_hd - 1 });
    hp.setWithWorker({ current: Math.min(max_hp, cur_hp + result) });

    for (var i = 0, l = tokens.length; i < l; i++) {
      notifyObservers('tokenChange', tokens[i], prevTokens[i]);
    }
  };

  const isHitDiceMessage = function (msg) {
    return msg.playerid.toLowerCase() != "api" &&
      msg.rolltemplate &&
      ["simple"].indexOf(msg.rolltemplate) > -1 &&
      _.has(msg, 'inlinerolls') &&
      msg.content.indexOf("^{hit-dice-u}") > -1;
  };

  setTimeout(function () {
    if('undefined' !== typeof TokenMod && TokenMod.ObserveTokenChange) {
      var original = TokenMod.ObserveTokenChange;
      TokenMod.ObserveTokenChange = function (handler) {
        original(handler);
        observeTokenChange(handler);
      };
      warn('Piggiebacking on TokenMod for token change observations.');
    };
  }, 1);

  on('ready', function () {
    on('chat:message', function (msg) {
      if (isHitDiceMessage(msg)) {
        var cname = msg.content.match(/charname=([^}]+)/)[1];
        if (cname) {
          var character = findObjs({ name: cname, type: 'character' })[0];
          if (character) {
            handlehd(msg, character);
          } else {
            warn("FAILED to find character by name " + cname);
          }
        } else {
          warn("FAILED to extract charname from chat message.");
        }
      }
    });
  });
}());
