const fs = require('fs');

let content = fs.readFileSync('src/app/students/admissions/page.tsx.bak', 'utf8');

// 1. Replace Imports
content = content.replace(/import { InputText } from 'primereact\/inputtext';/, "import { Input as InputText } from '@/components/ui/input';");
content = content.replace(/import { InputTextarea } from 'primereact\/inputtextarea';/, "import { Textarea as InputTextarea } from '@/components/ui/textarea';");
content = content.replace(/import { Button } from 'primereact\/button';/, "import { Button } from '@/components/ui/button';");
content = content.replace(/import { Tag } from 'primereact\/tag';/, "import { Badge } from '@/components/ui/badge';");
content = content.replace(/import { DataTable } from 'primereact\/datatable';\nimport { Column } from 'primereact\/column';/, "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';\nimport { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';");

// 2. Add Popover & Calendar imports
content = content.replace(/import { Calendar } from 'primereact\/calendar';/, 
  "import { Calendar } from '@/components/ui/calendar';\n" +
  "import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';\n" +
  "import { format } from 'date-fns';\n" +
  "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';"
);
content = content.replace(/import { Dropdown } from 'primereact\/dropdown';/, "");

// 3. Dropdown -> Select
content = content.replace(/<Dropdown[\s\S]*?value=\{([^}]+)\}[\s\S]*?options=\{([^}]+)\}[\s\S]*?onChange=\{e => ([^}]+)\(e\.value\)\}[\s\S]*?\/>/g, (match, val, opts, handler) => {
  return `<Select value={${val}} onValueChange={e => ${handler}(e)}>
    <SelectTrigger className="w-full bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-700">
      <SelectValue placeholder="Select" />
    </SelectTrigger>
    <SelectContent>
      {${opts}.map((opt: any) => (
        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>`;
});

// 4. Calendar -> Popover DatePicker
content = content.replace(/<Calendar[\s\S]*?value=\{([^}]+)\}[\s\S]*?onChange=\{e => ([^}]+)\(e\.value\)\}[\s\S]*?\/>/g, (match, val, handler) => {
  return `<Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className={\`w-full justify-start text-left font-normal \${!${val} && "text-muted-foreground"}\`}>
        <CalendarIcon className="mr-2 h-4 w-4" />
        {${val} ? format(${val}, "PPP") : <span>Pick a date</span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0">
      <Calendar mode="single" selected={${val}} onSelect={e => ${handler}(e)} initialFocus />
    </PopoverContent>
  </Popover>`;
});

// 5. Replace simple DataTable with Table. This is hard via Regex.
// For the DataTable, we can replace the entire block manually.
// Find the index of <DataTable
const dataTableStart = content.indexOf('<DataTable');
const dataTableEnd = content.indexOf('</DataTable>') + 12;

if (dataTableStart !== -1) {
  const customTable = `
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
          <TableRow>
            <TableHead className="w-[100px]">Adm. No.</TableHead>
            <TableHead>Student Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingStudents ? (
             <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
          ) : studentsList.length === 0 ? (
             <TableRow><TableCell colSpan={6} className="text-center">No students found.</TableCell></TableRow>
          ) : (
            studentsList.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.admissionNo}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-xs">
                      {(d.name || d.firstName || '?')[0]}
                    </div>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
                      {d.name || \`\${d.firstName || ''} \${d.lastName || ''}\`.trim()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">{d.className || d.class?.name || '—'}</TableCell>
                <TableCell className="text-xs">{d.academicYear}</TableCell>
                <TableCell>
                  <Badge variant={d.status === 'ACTIVE' ? 'default' : 'secondary'} className={d.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}>
                    {d.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={\`/students/\${d.id}\`}>
                    <Button variant="outline" size="sm" className="h-7 text-[10px]">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4 px-4">
        <Button variant="outline" size="sm" onClick={() => setListPage(p => Math.max(1, p - 1))} disabled={listPage === 1 || loadingStudents}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <div className="text-xs font-semibold">Page {listPage}</div>
        <Button variant="outline" size="sm" onClick={() => setListPage(p => p + 1)} disabled={studentsList.length < 12 || loadingStudents}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  `;
  content = content.substring(0, dataTableStart) + customTable + content.substring(dataTableEnd);
}

fs.writeFileSync('src/app/students/admissions/page.tsx', content);
console.log('Migration Complete.');
