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