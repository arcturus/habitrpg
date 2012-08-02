// Generated by CoffeeScript 1.3.3
var content, expModifier, hpModifier, score, tally, updateStats;

content = require('./content');

expModifier = function(user, value) {
  var dmg, modified;
  dmg = user.get('items.weapon') * .03;
  dmg += user.get('stats.lvl') * .03;
  modified = value + (value * dmg);
  return modified;
};

hpModifier = function(user, value) {
  var ac, modified;
  ac = user.get('items.armor') * .03;
  ac += user.get('stats.lvl') * .03;
  modified = value - (value * ac);
  return modified;
};

updateStats = function(user, stats) {
  var money, tnl;
  if (stats.hp != null) {
    if (stats.hp < 0) {
      user.set('stats.lvl', 0);
    } else {
      user.set('stats.hp', stats.hp);
    }
  }
  if (stats.exp != null) {
    tnl = user.get('_tnl');
    if (stats.exp >= tnl) {
      stats.exp -= tnl;
      user.set('stats.lvl', user.get('stats.lvl') + 1);
    }
    if (!user.get('items.itemsEnabled') && stats.exp >= 50) {
      user.set('items.itemsEnabled', true);
      $('ul.items').popover({
        title: content.items.unlockedMessage.title,
        placement: 'left',
        trigger: 'manual',
        html: true,
        content: "<div class='item-store-popover'>          <img src='/img/BrowserQuest/chest.png' />          " + content.items.unlockedMessage.content + " <a href='#' onClick=\"$('ul.items').popover('hide');return false;\">[Close]</a>          </div>"
      });
      $('ul.items').popover('show');
    }
    user.set('stats.exp', stats.exp);
  }
  if (stats.money != null) {
    if (!(typeof money !== "undefined" && money !== null) || money < 0) {
      money = 0.0;
    }
    return user.set('stats.money', stats.money);
  }
};

module.exports.score = score = function(spec) {
  var adjustvalue, cron, delta, direction, exp, hp, lvl, money, sign, task, type, user, value, _ref, _ref1;
  if (spec == null) {
    spec = {
      user: null,
      task: null,
      direction: null,
      cron: null
    };
  }
  _ref = [spec.user, spec.task, spec.direction, spec.cron], user = _ref[0], task = _ref[1], direction = _ref[2], cron = _ref[3];
  sign = direction === "up" ? 1 : -1;
  value = task.get('value');
  delta = value < 0 ? (-0.1 * value + 1) * sign : (Math.pow(0.9, value)) * sign;
  type = task.get('type');
  adjustvalue = type !== 'reward';
  if ((type === 'habit') && (task.get("up") === false || task.get("down") === false)) {
    adjustvalue = false;
  }
  if (adjustvalue) {
    value += delta;
  }
  if (type === 'habit') {
    if (task.get('value') !== value) {
      task.push('history', {
        date: new Date(),
        value: value
      });
    }
  }
  task.set('value', value);
  _ref1 = [user.get('stats.money'), user.get('stats.hp'), user.get('stats.exp'), user.get('stats.lvl')], money = _ref1[0], hp = _ref1[1], exp = _ref1[2], lvl = _ref1[3];
  if (type === 'reward') {
    money -= task.get('value');
    if (money < 0) {
      hp += money;
      money = 0;
    }
  }
  if ((delta > 0 || (type === 'daily' || type === 'todo')) && !cron) {
    exp += expModifier(user, delta);
    money += delta;
  } else if (type !== 'reward' && type !== 'todo') {
    hp += hpModifier(user, delta);
  }
  updateStats(user, {
    hp: hp,
    exp: exp,
    money: money
  });
  return delta;
};

module.exports.tally = tally = function(model) {
  var absVal, completed, expTally, key, lvl, task, todoTally, type, user, value, _ref;
  user = model.at('_user');
  todoTally = 0;
  for (key in model.get('_user.tasks')) {
    task = model.at("_user.tasks." + key);
    _ref = [task.get('type'), task.get('value'), task.get('completed')], type = _ref[0], value = _ref[1], completed = _ref[2];
    if (type === 'todo' || type === 'daily') {
      if (!completed) {
        score({
          user: user,
          task: task,
          direction: 'down',
          cron: true
        });
      }
      if (type === 'daily') {
        task.push("history", {
          date: new Date(),
          value: value
        });
      } else {
        absVal = completed ? Math.abs(value) : value;
        todoTally += absVal;
      }
      if (type === 'daily') {
        task.pass({
          cron: true
        }).set('completed', false);
      }
    }
  }
  model.push('_user.history.todos', {
    date: new Date(),
    value: todoTally
  });
  expTally = user.get('stats.exp');
  lvl = 0;
  while (lvl < (user.get('stats.lvl') - 1)) {
    lvl++;
    expTally += 50 * Math.pow(lvl, 2) - 150 * lvl + 200;
  }
  return model.push('_user.history.exp', {
    date: new Date(),
    value: expTally
  });
};