import  main=require("./main")
import path=require("path")
import fs=require("fs")

var program = require('commander');

program.arguments('<file>')
    .option('-o, --out <output>', 'output')
    .option('-w, --watch', 'watch for the changes')
    .action(function (file) {
        let extracted = function () {
            main.parseToJSON(file, (x) => {
                delete x.ramlSource;
                var rs = "var result=" + JSON.stringify(x, null, 2) + "\nexport=result";
                if (program.out) {
                    fs.writeFileSync(program.out, rs);
                }
                else {
                    console.log(rs)
                }

            })
        };
        extracted();
        if (program.watch) {
            console.log("Start watching")
            fs.watchFile(file,{interval:100}, x => {
                extracted();
            })
        }
    }).parse(process.argv);