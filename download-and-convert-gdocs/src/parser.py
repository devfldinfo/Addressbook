from math import ceil
from typing import List, Dict
from collections import OrderedDict

class Parser:

    def __init__(self, raw_input):
        self.__raw_input = raw_input

    def parse(self) -> Dict:
        elements = self.__raw_input

        i = 0
        structured_text = OrderedDict()
        while i + 1 < len(elements):
            if 'paragraph' in elements[i] and 'table' in elements[i+1]:
                section_name  = self.__parse_section(elements[i])
                table_content = self.__parse_unit   (elements[i+1])
                structured_text[section_name] = table_content
                i += 1
            i += 1

        print('Successfully Parsed!')
        return structured_text

    def __parse_section(self, value):
        elements = value.get('paragraph').get('elements')
        section_name = ''
        for elem in elements:
            section_name += self.__read_paragraph_element(elem).strip()
        return section_name.strip()

    @staticmethod
    def __read_paragraph_element(element):
        text_run = element.get('textRun')
        if not text_run:
            return ''
        content = text_run.get('content')
        # if paragraph is a link, it extracts it and makes it in LaTeX format
        if 'textStyle' in text_run and 'link' in text_run['textStyle']:
            url_link = text_run.get('textStyle').get('link').get('url')
            return r'\myhref{' + url_link + '}{' + content + '}'
        return content

    def __parse_unit(self, value) -> List[List]:
        table = []
        rows = value.get('table').get('tableRows')
        for row in rows:
            row_ = []
            for cell in row.get('tableCells'):
                cell_ = self.__parse_paragraphs(cell.get('content'))
                while isinstance(cell_, list) and '' in cell_:
                    cell_.remove('')

                if isinstance(cell_, list) and len(cell_) == 1:
                    row_.append(cell_[0])
                elif len(cell_):
                    row_.append(cell_)

            table.append(row_)

        return table

    def __parse_paragraphs(self, elements):
        paragraphs = []
        for value in elements:
            for elem in value.get('paragraph').get('elements'):
                paragraph = self.__read_paragraph_element(elem).strip()
                paragraphs.append(paragraph)

        # There is a need to combine neighboring paragraphs with a paragraph that contains a link
        i = 0
        while i < len(paragraphs):
            if 'href' in paragraphs[i]:
                # to avoid segmentation fault
                i_before = max(i-1, 0)
                i_after  = min(i+1, len(paragraphs)-1)

                i_min = min(i_before, i)
                i_max = max(i, i_after)

                chunks = [paragraphs.pop(k) for k in range(i_max, i_min-1, -1)]
                completed = ' '.join(chunks[::-1])
                paragraphs.insert(i_min, completed)
            i += 1
        return paragraphs if len(paragraphs) > 1 else paragraphs[0]


def main():
    import dill, json

    with open('data_jar/getter_output.pkl', 'rb') as inp:
        doc_content = dill.load(inp)

    p = Parser(doc_content)
    structured_text = p.parse()
    # print(json.dumps(structured_text, indent=4))
    with open("data_output/document.json", 'w') as f:
        # f.write(json.dumps(structured_text, indent=4).replace('\\\\', '\\'))
        f.write(json.dumps(structured_text, indent=4))


if __name__ == '__main__':
    main()
