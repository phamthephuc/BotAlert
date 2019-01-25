/**
 * Created by pc1 on 1/22/2019.
 */
var doNothing = function (err) {
};
function getDayBefore(crrDay) {
    if (crrDay == 0) return 6;
    return crrDay - 1;
}

function getDayAfter(crrDay) {
    if (crrDay == 6) return 0;
    return crrDay + 1;
}
module.exports = {doNothing, getDayBefore, getDayAfter}