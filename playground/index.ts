import 'angular';
import {ngGridView} from '../src/gridview';

require('../src/gridview.scss');
require('./style.scss');

angular.module('exampleApp', [ngGridView])
    .controller('MainCtrl', ['$scope', ($scope) => {
        let cellList = [];
        for(let i = 0; i < 200; i++) {
            cellList.push({name: `dataName:${i}`});
        }
        $scope.dataList = cellList;
    }]);