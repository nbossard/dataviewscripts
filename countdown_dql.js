// This script is to search in all files for markers like "(coundown::mariage)"
// and display those occuring "soon"
// "soon" is different for each countdown through field : CoundownBeforeDays
//
// sample text : 
//      ==Nat en déplacement à Paris== 
//      %%(Countdown::Nat en déplacement à Paris) (CoundownBeforeDays::7 days)%%
//
// can be easily added thanks to quickadd countdown

dv.execute("TABLE date(file.name)-date(this.file.name) as délai, Countdown FROM \"Agenda\" WHERE Countdown and date(file.name) >= date(this.file.name) and (date(file.name)-date(this.file.name)) < dur(CoundownBeforeDays) SORT file.name");
