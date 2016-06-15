import 'angular';
import 'rxjs';
import {MODULE_NAME} from '../src/gridview';

require('../src/gridview.scss');
require('./style.scss');

angular.module('exampleApp', [MODULE_NAME])
    .controller('MainCtrl', ['$scope', ($scope) => {
        let cellList = [];
        for(let i = 0; i < 200; i++) {
            cellList.push({name: `dataName:${i}`});
        }
        $scope.dataList = cellList;
    }]);