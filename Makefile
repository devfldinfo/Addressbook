.PHONY: cv

CC = xelatex
CV_DIR = cv
CV_SRCS = cv/sections.tex
PD_DIR = cv/personal_data
PD_SRCS = $(shell find $(PD_DIR) -name '*.tex')

output.pdf: /output.tex
	$(CC) -output-directory= output $<

clean:
	rm -rf output/*.pdf
