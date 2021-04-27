const {youtubeToShortcut, gdrivevideoToShortcut} = require("./utils/util")
const sqlite3 = require('sqlite3').verbose()
db = new sqlite3.Database(process.env.DBPATH, (err) => {
    if (err) {
        console.error(err, 'error')
    }
    console.log('Connected to the main database.')
})

// useful if there are youtube full uris in the database
db.all(`SELECT uri FROM video;`, (e, rows) => {
    if(e) {
        throw e
    }
    rows.forEach(row => {
        if(/youtube\.com/.exec(row.uri) || /youtu\.be/.exec(row.uri)) {
            console.log(row.uri)
            let result = youtubeToShortcut(row.uri)
            new Promise((res, rej) => {
                if(result[1].length === 1) {
                    db.run(`UPDATE video SET uri=? WHERE uri=?;`, [`youtube:${result[0]}${result[1]}`, row.uri], (err) => {
                        if(err) {
                            rej(err)
                        } else {
                            res({id: result[0]+result[1]})
                        }
                    })
                } else {
                    db.run(`UPDATE video SET uri=?, uriParam=? WHERE uri=?;`, [`youtube:${result[0]}`, result[1], row.uri], (err) => {
                        if(err) {
                            rej(err)
                        } else {
                            res({id: result[0], param: result[1]})
                        }
                    })
                }
            }).then(console.log, console.error)
        } else if(/drive.google.com\/file\/d\/([0-9A-Za-z_\-]+)/.exec(row.uri)) {
            console.log(row.uri)
            let result = gdrivevideoToShortcut(row.uri)
            new Promise((res, rej) => {
                db.run(`UPDATE video SET uri=?, uriParam=? WHERE uri=?;`, [`gdrive:${result[0]}`, result[1], row.uri], (err) => {
                    if(err) {
                        rej(err)
                    } else {
                        res({id: result[0], param: result[1]})
                    }
                })
            }).then(console.log, console.error)
        }
    })
})
