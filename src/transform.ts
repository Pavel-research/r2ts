import  main=require("./main")
import path=require("path")
import fs=require("fs")

var program = require('commander');

program.arguments('<file>')
    .option('-o, --out <output>', 'output')
    .option('-w, --watch', 'watch for the changes')
    .action(function (file) {

        let extracted = function () {
            var files=file.split(",");
            var count=0;
            var result={ types:{}};
            files.forEach(x=> {
                main.parseToJSON(x, (x) => {

                    delete x.ramlSource;
                    if (x.types){
                        Object.keys(x.types).forEach(k=>result.types[k]=x.types[k]);
                    }
                    count++;
                    if (count==files.length) {
                        var rs = "var result=" + JSON.stringify(result, null, 2) + "\nexport=result";
                        if (program.out) {
                            fs.writeFileSync(program.out, rs);
                        }
                        else {
                            console.log(rs)
                        }
                    }
                })
            });
        };
        extracted();
        if (program.watch) {
            console.log("Start watching")
            fs.watchFile(file,{interval:100}, x => {
                extracted();
            })
        }
    }).parse(process.argv);