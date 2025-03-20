.PHONY: cv

CC = Luatex
CV_DIR = output

cv.pdf: output.tex
	$(CC) -output-directory=$(CV_DIR) $<

clean:
	rm -rf $(CV_DIR)/*.pdf
