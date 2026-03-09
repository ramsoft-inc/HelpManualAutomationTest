const moment = require('moment');

class DateTimeHelper {
	formatDateTime(date, format) {
		const dateFormat = format ?? 'MM/DD/YYYY | hh:mm A';
		return moment(date).format(dateFormat);
	}
}

const dateTimeHelper = new DateTimeHelper();
module.exports = { dateTimeHelper };

