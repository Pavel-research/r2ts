import  main=require("./main")
import path=require("path")
import fs=require("fs")
import {InterfaceGenerator} from "./interfaceGenerator";

var program = require('commander');

program.arguments('<file>')
    .option('-o, --out <output>', 'output')
    .option('-w, --watch', 'watch for the changes')
    .action(function (file) {
        let extracted = function () {
            main.parseToJSON(file, (x) => {
                delete x.ramlSource;
                //console.log(x)
                var g = new InterfaceGenerator();
                try {
                    g.process(x);
                } catch (e){
                    console.log(e.stack)
                }
                if (program.out) {
                    var f=path.join(path.dirname(program.out),"types.ts");
                    fs.writeFileSync(f, "export=" + JSON.stringify(x, null, 2));
                    fs.writeFileSync(program.out, g.toString());
                }
                else {
                    console.log(g.toString())
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