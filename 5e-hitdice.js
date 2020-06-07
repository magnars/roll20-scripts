/* global findObjs, log, sendChat, on, _ */

(function () {
  var sendRollTemplate = function (id, msg) {
    sendChat(
      id,
      "<div class='sheet-rolltemplate-simple'><div class='sheet-container'><div class='sheet-label' style='padding:5px 10px;'><span>" +
        msg +
        "</span></div></div></div>"
    );
  };

  var warn = function (msg) {
    log("[5e-hitdice]: " + msg);
  };

  var getAttr = function (charId, name) {
    return findObjs({
      type: 'attribute',
      characterid: charId,
      name: name
    }, { caseInsensitive: true })[0];
  };

  var handlehd = function (msg, character) {
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

    var curhd = parseInt(hd.get("current"));
    var maxhp = parseInt(hp.get("max"));
    var curhp = parseInt(hp.get("current"));

    if (curhd === 0) {
      sendRollTemplate(msg.who, name + " has no hit dice remaining.");
      return;
    }
    if (curhp === maxhp) {
      sendRollTemplate(msg.who, name + " already at full hit points, no hit dice used.");
      return;
    }

    var result = msg.inlinerolls[2].results.total ? msg.inlinerolls[2].results.total : false;
    if (result === false) {
      warn("FAILED to extract hit dice result from chat message.");
      return;
    }

    hd.set({ current: curhd - 1 });
    hp.set({ current: Math.min(maxhp, curhp + result) });
  };

  var isHitDiceMessage = function (msg) {
    return msg.playerid.toLowerCase() != "api" &&
      msg.rolltemplate &&
      ["simple"].indexOf(msg.rolltemplate) > -1 &&
      _.has(msg, 'inlinerolls') &&
      msg.content.indexOf("^{hit-dice-u}") > -1;
  };

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
}());
