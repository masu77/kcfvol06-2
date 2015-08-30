(function() {
    'use strict';

    // レコード追加画面の保存実行前イベント
    kintone.events.on(['app.record.create.submit'], function(event) {
        var record = event.record;

        var exportQuantity = Number(record['出庫量']['value']);

        var appId = 78;     // 商品マスタのアプリIDの設定
        var params = {
            app: appId,
            query: '商品コード = "' + record.商品コード.value + '"'
        };

        kintone.api(
            kintone.api.url('/k/v1/records', true),
            'GET',
            params
        ).then(function(resp) {
            if (!resp.records[0]) {
                event['error'] = "商品マスタが見つかりません。";
                return event;
            } else {
                var updateQuantity = Number(resp.records[0]['在庫量']['value']) - exportQuantity;

                if (updateQuantity < 0) {
                    // 在庫数がマイナスになる場合はエラーにして中断
                    record['出庫量']['error'] = "在庫が足りません。";
                    event['error'] = "在庫が足りません。";
                    return event;
                }

                // 商品アプリの在庫数を更新
                var params = {
                    app: appId,
                    id: resp.records[0]['$id']['value'],
                    revision: resp.records[0]['$revision']['value'],
                    record: {"在庫量": {"value": updateQuantity}}
                };

                kintone.api(
                    kintone.api.url('/k/v1/record', true),
                    'PUT',
                    params
                ).then(function(resp) {
                    return event;
                }).catch(function(error) {
                    event['error'] = "更新に失敗しました。";
                    return event;
                });
            }
        }).catch(function(error) {
            event['error'] = "商品マスタを取得できませんでした。";
            return event;
        });
    });

})();
