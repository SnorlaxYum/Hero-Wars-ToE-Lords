# Hero-Wars-ToE-Lords

A robot intended for information exchanging about Hero Wars ToE Lords

## Fill the default database with combos

```
$ cp examples/main.db.example main.db
```

## Define Admin Roles able to delete or add things

```
$ mv examples/adminRoles.json.example adminRoles.json
```

Then edit it according to ur need

```
[{
    "guildId": "620111111122222222",
    "name": "Role"
}, {
    "guildId": "620111111122222221",
    "name": "Role2"
}]
```

`guildId` is ur guildId, `role` is the privileged role.

## Add a user and make it a service

```
$ sudo useradd hwtoe -d /var/lib/hwtoe
$ sudo mkdir /var/lib/hwtoe
$ sudo mv * /var/lib/hwtoe
$ sudo mv .git /var/lib/hwtoe
$ sudo chown -R hwtoe:hwtoe /var/lib/hwtoe
```

```
$ sudo vim /etc/systemd/system/hwtoe.service
```

As for the inside content, check `systemd/toelords.service`
`TOKEN` and `DBPATH` has to be specified to make this correctly work.

```
$ sudo systemctl daemon-reload && sudo systemctl start hwtoe && sudo systemctl status hwtoe
```

when it's working, enable it.

```
$ sudo systemctl enable hwtoe
```

## Daily Report

```
$ sudo vim /etc/systemd/system/hwtoedaily.service
```

As for the inside content, check `systemd/toedaily.service`
`TOKEN` and `DBPATH` has to be specified to make this correctly work.

```
$ sudo vim /etc/systemd/system/hwtoedaily.timer
```

As for the inside content, check `systemd/toedaily.timer`
OnCalendar value depends on the host's timezone.

```
$ sudo systemctl start hwtoedaily.timer && sudo systemctl enable hwtoedaily.timer
```