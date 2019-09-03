import React from 'react';

export function addLogMessage(day, log, message) {
  log.push(<p><b>Day {day}</b>&nbsp;<span>{message}</span></p>);
}
