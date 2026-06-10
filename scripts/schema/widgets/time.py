from typing import Optional

from ..common import StrictModel
from ..common import Color

class ClockWidget(StrictModel):
    show:   Optional[bool] = None
    format: Optional[str]  = None

class DateWidget(StrictModel):
    show:  Optional[bool] = None
    format: Optional[str] = None

class TimeWidgetHover(StrictModel):
    fg: Optional[Color] = None
    bg: Optional[Color] = None

class TimePopupControlsHover(StrictModel):
    fg: Optional[Color] = None

class TimePopupControls(StrictModel):
    fg:    Optional[Color]                  = None
    hover: Optional[TimePopupControlsHover] = None

class TimePopupCalendarWeek(StrictModel):
    fg: Optional[Color] = None

class TimePopupCalendarDayToday(StrictModel):
    fg:      Optional[Color] = None
    bg:      Optional[Color] = None
    outline: Optional[Color] = None

class TimePopupCalendarDaySelected(StrictModel):
    fg: Optional[Color] = None
    bg: Optional[Color] = None

class TimePopupCalendarDay(StrictModel):
    fg:       Optional[Color]                        = None
    bg:       Optional[Color]                        = None
    today:    Optional[TimePopupCalendarDayToday]    = None
    selected: Optional[TimePopupCalendarDaySelected] = None

class TimePopupCalendar(StrictModel):
    week: Optional[TimePopupCalendarWeek] = None
    day: Optional[TimePopupCalendarDay] = None

class TimePopup(StrictModel):
    bg: Optional[Color]                   = None
    controls: Optional[TimePopupControls] = None
    calendar: Optional[TimePopupCalendar] = None

class Time(StrictModel):
    fg:    Optional[Color]           = None
    bg:    Optional[Color]           = None
    hover: Optional[TimeWidgetHover] = None
    date:  Optional[DateWidget]      = None
    clock: Optional[ClockWidget]     = None
    popup: Optional[TimePopup]       = None
