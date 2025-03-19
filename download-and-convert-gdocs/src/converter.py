import json
import glob
import re

from typing import Dict, List
from pathlib import Path

LIMIT = 113  # dictated by LaTeX


class Converter:
    LONG_DIVIDER = '%' + '-' * 79 + '\n'
    SHORT_DIVIDER = '%' + '-' * 59 + '\n'
    INDENT = 2

    def __init__(self, content: Dict):
        self.__content = self.__group_n_label(content)
        self.__output = ['']

    def __str__(self) -> str:
        return json.dumps(self.__content, indent=4)

    def _generate_header(self, name: str, environment: str) -> str:
        output = self.LONG_DIVIDER
        output += '%\t' + name + '\n'
        output += self.LONG_DIVIDER
        output += fr'\cvsection{{{name}}}' + '\n'*3

        output += self.LONG_DIVIDER
        output += '%\tCONTENT\n'
        output += self.LONG_DIVIDER

        output += fr'\begin{{{environment}}}' + '\n'*2
        output += self.SHORT_DIVIDER
        return output

    @staticmethod
    def _generate_footer(environment: str) -> str:
        return fr'\end{{{environment}}}' + '\n'

    def convert_and_save(self, filepath='cv.tex') -> None:
        if '/' in filepath:
            Path(filepath[:filepath.rfind('/')]).mkdir(exist_ok=True)

        for section, content in self.__content.items():
            self._generate_page(section, content)

        with open(filepath, 'w') as f:
            f.write(self.__output[0])

        print(f"Successfully Converted and saved as {filepath}")

    def _generate_page(self, name: str, content) -> None:
        environment = 'cvskills' if re.match('.*skill.*', name.lower()) else 'cventries'

        output = self.__output
        output[0] += self._generate_header(name.upper(), environment)

        for row in content:
            indent = self.INDENT
            output[0] += ' ' * indent + '\\' + row[0] + '\n'
            indent += self.INDENT
            for column in row[1:]:
                if isinstance(column, str):
                    output[0] += ' ' * indent + f'{{{column}}}\n'
                elif isinstance(column, list):
                    output[0] += ' ' * indent + '{\n'
                    indent += self.INDENT
                    output[0] += ' ' * indent + r'\begin{cvitems}' + '\n'
                    indent += self.INDENT
                    for responsibility in column:
                        responsibility = responsibility.replace("%", "\%")
                        output[0] += ' ' * indent + f'\item{{{responsibility}}}\n'
                    indent -= self.INDENT
                    output[0] += ' ' * indent + r'\end{cvitems}' + '\n'
                    indent -= self.INDENT
                    output[0] += ' ' * indent + '}\n'

            output[0] += '\n' + self.SHORT_DIVIDER

        output[0] += self._generate_footer(environment)


    @staticmethod
    def __group_n_label(structured_text):
        def purified_len(line):
            if re.match('myhref', line):
                m = re.search("myhref{.*}{", line)
                return len(re.sub(r'[^\w\s]', '', line[:m.start()] + line[m.end()]))
            else:
                return len(line)

        # group
        group = {2: {2: {2: '#', 1: {2: '#'}}}}

        grouped_data = {}
        for key in structured_text:
            rows = structured_text[key]
            middle_term_format = [[]]

            branch = group
            for i in range(len(rows)):
                branch = branch[len(rows[i])]
                if isinstance(branch, str):
                    middle_term_format.append([])
                    branch = group[2]
                elif re.match('.*skill.*', key.lower()) and len(middle_term_format[-1]):
                    middle_term_format.append([])
                middle_term_format[-1].extend(rows[i])
            grouped_data[key] = middle_term_format

        # label
        def f5(elements: List):
            if isinstance(elements[-1], str) and purified_len(elements[-3] + elements[-1]) < LIMIT:
                elements.insert(0, 'cventryshort')
            else:
                elements.insert(0, 'cventry')

        def f4(elements: List):
            elements.insert(0, 'cventryshort')

        def f2(elements: List):
            elements.insert(0, 'cvskill')

        label = {5: f5, 4: f4, 2: f2}
        for key, array in grouped_data.items():
            for i in range(len(array)):
                label[len(array[i])](array[i])

        return grouped_data


if __name__ == '__main__':
    with open('../data_output/document.json', 'r') as f:
        cv = json.load(f)

    c = Converter(cv)
    c.convert_and_save()
