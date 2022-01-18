import * as moment from 'moment';
export function DateDifference(fromDateStr: string, toDateStr: string, dateDifferenceEnum: moment.unitOfTime.DurationConstructor): number {
    const fromDate = moment(fromDateStr, 'DD-MM-YYYY');
    const toDate = moment(toDateStr, 'DD-MM-YYYY');
    return toDate.diff(fromDate, dateDifferenceEnum);
}

export function TimeAgo(DateStr: string): string {
    return moment(DateStr).fromNow();
}
