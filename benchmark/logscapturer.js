'use strict';

module.exports = {
  start,
  stop,
  getTables,
  updateReadme
};



function start() {                                          // began to hook console.log so we can process logs soon
  if (console._log) {
    return;
  }
  console._log  = console.log;
  console._logs = [];                                       // we record all the logs here until stop was called
  console.log   = function () {
    console._log.apply(console, arguments);
    console._logs.push([].join.call(arguments, ' '));
  };
}


function stop() {
  if (!console._log) {
    return [];
  }
  var logs    = console._logs;
  console.log = console._log;
  delete console._log;
  delete console._logs;
  return logs;
}


function updateReadme(tables, lang) {                       // update the benchmarks datas into file "README.md"
  var fs      = require('fs');
  var path    = require('path');
  var readme  = path.join(__dirname, '../README.md');
  var content = '';
  if (lang) {
    readme    = path.join(__dirname, '../README_' + lang + '.md');
  }
  try {
    content   = fs.readFileSync(readme, 'utf-8');           // catch error for "no such file: README_zhCN.md"
  } catch (e) {}
  tables.forEach(function (table) {
    content   = updateTable(content, table, lang);          // when no matches found for update, we append to the tail of content
  });
  fs.writeFileSync(readme, content, 'utf-8');
  if (!lang) {
    updateReadme(tables, 'zhCN');
  }
}


function updateTable(content, table, lang) {
  var updated = 0;
  var matcher = getMatcher(table.title, lang);              // we do "replace" based on RegExp, to update a part of content
  var tbody   = table.tbody.join('\n');
  if (lang  === 'zhCN') {
    tbody   = tbody.replace(/ \| Operations \/ second \| Relative margin of error \|/g, ' | 每秒处理次数        | 相对误差                 |');
    tbody   = tbody.replace(/\(not supported\)/g, '( 不支持 )     ');
  }
  if (!matcher.h4txt) {                                     // the sub title of "Benchmarks" helps us to position tbody
    console.log('Unknown table title: ' + table.title);
  } else {
    var matches = content.match(matcher.regexp);
    if (!matches) {                                         // if can't determine the exact location to update tbody
      console.log('No matches found: ' + matcher.h4txt);    // we append title and tbody to the content below
    } else {
      updated = 1;
      content = content.replace(matcher.regexp, '$1\n' + tbody + '\n$3');
      console.log('update table: ' + table.title);
    }
  }
  if (!updated) {
    content = content + '\n#### ' + table.title + '\n' + tbody + '\n';
    console.log('append table: ' + table.title);
  }
  return content;
}


function getMatcher(title, lang) {
  // title was captured from "console.log" when benchmarks was running
  // we have to map that to what "README.md" said
  // then we can update benchmark result data on the right place
  var h4txt   = '';
  var h4txts  = {
    shallow:  ' Simple ',
    deep:     ' Complex ',
    circular: ' Circular ',
    special:  ' Special '
  };
  if (lang === 'zhCN') {
    h4txts  = {
      shallow:  ' 处理简单数据',
      deep:     ' 处理复杂数据',
      circular: ' 处理循环引用',
      special:  ' 处理特殊对象'
    };
  }
  h4txt = h4txts[title.split(' ')[0]];
  return {
    h4txt:  h4txt,
    regexp: new RegExp('(####' + h4txt + '[\\s\\S]+?)(\\n\\| +\\| [\\s\\S]+?)(\\n#{2,4} .+)')
  };
}


function getTables(logs, printTable) {
  return matchGroups(logs).map(function (datas) {
    datas.tbody = formatTable(datas);
    if (printTable) {
      console.log('\n' + datas.title + '\n');
      console.log(datas.tbody.join('\n'));
      console.log('\n');
    }
    return datas;
  });
}


function matchGroups(logs) {                                // match the main information from the logs and store them by group
  var groups  = [];
  var datas   = {};
  var skip    = 1;
  logs.forEach(function (item) {
    if (item.indexOf('Running ') === 0) {                   // catch logs between "Running" and "complete"
      skip    = 0;
      datas   = {};                                         // catch the follow logs to a new data
      datas.title = item.split(' ').slice(1, -1).join(' ');
      datas.rows  = [];
    } else if (item.indexOf('...complete,') === 0) {
      skip = 1;
      datas.rows.sort(function (a, b) {                     // sort by field "ops/sec", biggest first
        return (+b[1].replace(/,/g, '') || 0) - (+a[1].replace(/,/g, '') || 0);
      });
      groups.push(datas);                                   // we got a group of data where "complete" was found
    } else if (!skip && item) {
      var matchs = item.match(/^(.+?) x (.+?) ops\/sec ±(.+?%)/);
      matchs = matchs || [item, item.replace(/: $/, ' (not supported)'), ' ', ' '];
      matchs = matchs.slice(1, 4);
      datas.rows.push(matchs);                              // main information that we matched from logs by console.log
    }
  });
  return groups;
}


function formatTable(datas) {
  var ths   = [' ', 'Operations / second', 'Relative margin of error'];
  var lens  = [0, 0, 0];                                    // the max length of content by columns
  var tbody = [ths, ['-', '-', '-']].concat(datas.rows);    // thead for rows[0], and split lines for rows[1]
  tbody[2]  = tbody[2].map(function (td) {                  // and rows[2] is the fastest one, we mark them as stronger
    return '**' + td + '**';
  });
  tbody.forEach(function (tr) {
    tr.forEach(function (td, index) {
      lens[index] = Math.max(lens[index], td.length);       // find the max length of content by columns, include the thead
    });
  });
  return tbody.map(function (tds, index) {
    var pads = index === 1 ? '-' : ' ';                     // rightPad the content by character space, for the split line we use "-"
    tds = tds.map(function (td, itd) {
      return (td + Array(lens[itd] + 1).join(pads)).slice(0, lens[itd]);
    });
    return '| ' + tds.join(' | ') + ' |';                   // we align the vertical split line by rightPad the content
  });
}

